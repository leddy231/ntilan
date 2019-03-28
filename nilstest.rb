










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
puts $firebase.get("users").body.to_json
