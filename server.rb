require 'firebase'
require "./verifier"
require "certified"
require "sanitize"
require 'sinatra'

firebase = {
	"type": "service_account",
	"auth_uri": "https://accounts.google.com/o/oauth2/auth",
	"token_uri": "https://accounts.google.com/o/oauth2/token",
	"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
	"project_id": ENV["fire_project_id"],
	"private_key_id": ENV["fire_private_key_id"],
	"private_key": ENV["fire_private_key"].gsub("_n_", "\n").gsub("_s_", " "),
	"client_email": ENV["fire_client_email"],
	"client_id": ENV["fire_client_id"],
	"client_x509_cert_url": ENV["fire_client_x509_cert_url"]
}

$firebase = Firebase::Client.new(ENV["fire_base_url"], firebase.to_json)
$verifier = FirebaseIDTokenVerifier.new(ENV["fire_project_id"])
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

def isAdmin(token)
	token = verifyUser(token)
	if token
		return token["user_id"] == $adminUID
	end
	return false
end

def verifyUser(token)
	begin
		key = FirebaseIDTokenVerifier.retrieve_and_cache_jwt_valid_public_keys[0]
		decoded = $verifier.decode(token, key)
		return decoded[0]
	rescue Exception => e
		logger.info(e)
		return false
	end
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

post '*' do
	request.body.rewind
	@body = JSON.parse(Sanitize.fragment(request.body.read))
	pass
end

get "/" do
	redirect to("/index")
end

post "/rename" do
	name = @body["name"]
	email = @body["email"]
	user = verifyUser(@body["token"])
	if user
		id = user["user_id"]
		$firebase.update("users/#{id}/", {"name" => name, "email" => email})
	end
end

post "/cancel" do
	token = @body["token"]
	if @body["adminForced"]
		if (isAdmin(token))
			cancel(@body["id"])
		end
	else
		user = verifyUser(token)
		if user
			id = user["user_id"]
			cancel(id)
		end
	end
end

post "/book" do
	table = @body["table"]
	user = verifyUser(@body["token"])
	if user
		id = user["user_id"]
		section, row, seat = table.split("-")
		isUsed = $firebase.get("lans/#{$active}/sections/#{section}/#{row}/#{seat}").body
		if !isUsed
			cancel(id)
			$firebase.update("users/#{id}/tables/", {$active => table})
			$firebase.set("lans/#{$active}/sections/#{section}/#{row}/#{seat}", id)
		end
	end
end

get "/tables/*" do
	token = params[:splat][0]
	@active = $active
	if isAdmin(token)
		erb :adminTables, :layout => false
	else
		erb :tables, :layout => false
	end
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

get '/exit' do
  Process.kill('TERM', Process.pid)
end

not_found do
  status 404
  "Ya broke it"
end

# post "/admin" do
# 	#send(params[:time])
# end
#
# get "/admin/*" do
# 	token = params['splat'][0]
# 	ip = request.ip
# 	if !Tokens.any?{|tok| tok[0] == token && tok[1] == ip}
# 		redirect to("/index")
# 		break
# 	end
#
# 	html = ''
# 	content = ''
# 	File.open(File.dirname(__FILE__) + "/index.html", "rb") do |file|
# 		html = file.read
# 	end
# 	File.open(File.dirname(__FILE__) + "/sites/adminaccess.html", "rb") do |file|
# 		content = file.read
# 	end
# 	html.gsub!("CONTENT", content)
# 	html
# end
#
# post "/adminpass" do
# 	pass = params["password"]
# 	if pass == AdminPass
# 		token = (0...50).map{('a'..'z').to_a.sample}.join
# 		Tokens << [token, request.ip]
# 		redirect to("/admin/#{token}")
# 	else
# 		redirect to("/index")
# 	end
# end
