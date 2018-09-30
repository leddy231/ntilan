require 'firebase'
require "./verifier"
require "certified"
require "sanitize"
require 'sinatra'
require "mini-heroku"

def firebaseInstance(path)
    data = $firebase.get(path).body
    yield data
    $firebase.set(path, data)
end

$firebase_web_config = MH.env("firebase_web_config")
$firebase_server_config = MH.env("firebase_server_admin_config")
$firebase = Firebase::Client.new($firebase_web_config["databaseURL"], $firebase_server_config.to_json)
$verifier = FirebaseIDTokenVerifier.new($firebase_web_config["projectId"])
firebaseInstance("") do |firebase|
	$active = firebase["active"]
	$adminUID = firebase["admin"]
end


if Sinatra::Application.environment == :development
	use Rack::Logger
else
	require 'rack/ssl'
	use Rack::SSL
end

helpers do
  def logger
    request.logger
  end
end

before do
	cache_control :public, :must_revalidate, :max_age => 60 * 5
end

set :static_cache_control, :max_age => 60 * 5

def decodeToken(token)
	decoded = false
	begin
		key = FirebaseIDTokenVerifier.retrieve_and_cache_jwt_valid_public_keys[0]
		decoded = $verifier.decode(token, key)
		decoded = decoded[0]
	rescue Exception => e
		logger.info(e)
		return {success: false, id: "", admin: false}
	end
	admin = false
	id = ""
	if decoded
		id = decoded["user_id"]
		admin = (id == $adminUID)
	end
	return {success: decoded, id: id, admin: admin}
end

def cancel(id, firebase)
	table = firebase.dig("users", id, "tables", $active)
	if table
		section, row, seat = table.split("-")
		oldTableBooked = firebase.dig("lans", $active, "sections", section, row, seat)
		if oldTableBooked && oldTableBooked == id
			firebase.dig("lans", $active, "sections", section, row)[seat] = false
		end
		firebase.dig("users", id, "tables")[$active] = false
	end
end

def getTables(lan, users)
	sections = []
	lan["sections"].each do |secName, section|
		newSection = {name: secName, rows: [] }
		section.each do |rowName, row|
			newRow = {name: rowName, seats: [] }
			if row.is_a? Array
				row = Hash[(0...row.size).zip row]
			end
			row.each do |number, occupant|
				next if number == 0 or number == "arrayfix"
				if occupant
					occupant = users[occupant]["name"].capitalize
				else
					occupant = false
				end
				newSeat = {number: number, occupant: occupant, id: secName + "-" + rowName + "-" +number.to_s}
				newRow[:seats] << newSeat
			end
			newSection[:rows] << newRow
		end
		sections << newSection
	end
	return sections
end

def getData(token, firebase)
	lan = firebase.dig("lans", $active)
	users = firebase["users"]
	sections = {}
	if lan["open"]
		sections = getTables(lan, users)
	end
	user = users[token[:id]]
	data = {sections: sections, 
			name: user["name"], 
			seat: user.dig("tables", $active), 
			admin: token[:admin], 
			open: lan["open"]}
	if token[:admin]
		data[:users] = getUsers(firebase)
	end
	return data.to_json
end

def getUsers(firebase)
	users = firebase["users"].dup.to_a
	users.map! do |a|
		name = a[1]['name']
		id = a[0]
		email = a[1]['email']
		seat = a[1].dig("tables", $active)
		seat = seat ? seat : false
		{name: name, id: id, email: email, seat: seat}
	end
	users.sort!{|a, b| a[:name].downcase <=> b[:name].downcase}
	return users
end

post '*' do
	request.body.rewind
	@body = JSON.parse(Sanitize.fragment(request.body.read))
	pass
end

post "/rename" do
	name = @body["name"]
	email = @body["email"]
	token = decodeToken(@body["token"])
	data = {}
	if token[:success]
		firebaseInstance("") do |firebase|
			user = firebase["users"][token[:id]] = {
				"name" => name,
				"email" => email,
				"tables" => {$active => false}
			}
			data = getData(token, firebase)
		end
	end
	data
end

post "/cancel" do
	token = decodeToken(@body["token"])
	data = {}
	if token[:success]
		firebaseInstance ("") do |firebase|
			if @body["adminForced"]
				if (token[:admin])
					cancel(@body["id"], firebase)
				end
			else
				cancel(token[:id], firebase)
			end
			data = getData(token, firebase)
		end
	end
	data
end

post "/book" do
	table = @body["table"]
	token = decodeToken(@body["token"])
	data = {}
	if token[:success]
		section, row, seat = table.split("-")
		firebaseInstance("") do |firebase|
			isUsed = firebase.dig("lans", $active, "sections", section, row, seat)
			if !isUsed
				cancel(token[:id], firebase)
				firebase.dig("users", token[:id], "tables")[$active] = table
				firebase.dig("lans", $active, "sections", section, row)[seat] = token[:id]
			end
			data = getData(token, firebase)
		end
	end
	data
end

get "/landata/*" do
	token = params[:splat][0]
	data = ""
	token = decodeToken(token)
	logger.info(token)
	if token[:success]
		firebaseInstance ("") do |firebase|
			data = getData(token, firebase)
		end
	end
	data
end

get "/booking.js" do
	content_type 'text/javascript'
	ERB.new(File.read("./booking.js")).result
end

get "/" do
	redirect to("/index")
end

get "/index" do
	erb :home
end

get "/rules" do
	erb :rules
end

get "/booking" do
	erb :booking
end

get "/spinner" do
	erb :spinner
end

not_found do
  status 404
  "Ya broke it"
end
