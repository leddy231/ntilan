require 'firebase'
require "./verifier"
require "certified"
require "sanitize"
require 'sinatra'
require "mini-heroku"

$firebase_web_config = MH.env("firebase_web_config")
$firebase_server_config = MH.env("firebase_server_admin_config")
$firebase = Firebase::Client.new($firebase_web_config["databaseURL"], $firebase_server_config.to_json)
$verifier = FirebaseIDTokenVerifier.new($firebase_web_config["projectId"])
$active = $firebase.get("active").body
$adminUID = $firebase.get("admin").body

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

def decodeToken(token)
	decoded = false
	begin
		key = FirebaseIDTokenVerifier.retrieve_and_cache_jwt_valid_public_keys[0]
		decoded = $verifier.decode(token, key)
		decoded = decoded[0]
	rescue Exception => e
		logger.info(e)
		return false
	end
	admin = false
	id = ""
	if decoded
		id = decoded["user_id"]
		admin = (id == $adminUID)
	end
	return {success: decoded, id: id, admin: admin}
end

def cancel(id)
	table = $firebase.get("users/#{id}/tables/#{$active}").body
	if table
		section, row, seat = table.split("-")
		oldTableBooked = $firebase.get("lans/#{$active}/sections/#{section}/#{row}/#{seat}").body
		if oldTableBooked && oldTableBooked == id
			$firebase.update("lans/#{$active}/sections/#{section}/#{row}", {"#{seat}" => false})
		end
		$firebase.update("users/#{id}/tables/", {$active => false})
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
				next if number == 0
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

def getData(token)
	lan = $firebase.get("lans/#{$active}/").body
	users = $firebase.get("users").body
	sections = {}
	if lan["open"]
		sections = getTables(lan, users)
	end
	user = users[token[:id]]
	return {sections: sections, name: user["name"], seat: user.dig("tables", $active), admin: token[:admin], open: lan["open"]}.to_json
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
	if token[:success]
		$firebase.update("users/#{token[:id]}/", {"name" => name, "email" => email})
	end
end

post "/cancel" do
	token = decodeToken(@body["token"])
	data = {}
	if token[:success]
		if @body["adminForced"]
			if (token[:admin])
				cancel(@body["id"])
			end
		else
			cancel(token[:id])
			data = getData(token)
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
		isUsed = $firebase.get("lans/#{$active}/sections/#{section}/#{row}/#{seat}").body
		if !isUsed
			cancel(token[:id])
			$firebase.update("users/#{token[:id]}/tables/", {$active => table})
			$firebase.set("lans/#{$active}/sections/#{section}/#{row}/#{seat}", token[:id])
		end
		data = getData(token)
	end
	data
end

get "/landata/*" do
	token = params[:splat][0]
	data = ""
	token = decodeToken(token)
	logger.info(token)
	if token[:success]
		data = getData(token)
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
