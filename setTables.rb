










#
#
# WARNING
# THIS WILL RESET THE ENTIRE BOOKING
# WARNING
#
#
#







require "json"
require "firebase"
require "mini-heroku"

MH.loadEnvironment
$firebase_web_config = MH.env("firebase_web_config")
$firebase_server_config = MH.env("firebase_server_admin_config")
$firebase = Firebase::Client.new($firebase_web_config["databaseURL"], $firebase_server_config.to_json)
$active = $firebase.get("active").body

tablesPerRow = 8
rowsPerSection = 2
sections = 4
j = Hash.new
nr = 1
sections.times do |s|
	sec = Hash.new
	rowsPerSection.times do |r|
		row = Hash.new
		tablesPerRow.times do |t|
			row["#{nr}"] = false
			nr += 1
		end
		sec["row#{r}"] = row
	end
	j["sec#{s}"] = sec
end
#puts j.inspect
$firebase.set("lans/var2019/sections", j)
puts  $firebase.get("lans/var2019/sections").body
