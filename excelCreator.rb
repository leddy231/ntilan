require "json"
require "firebase"
require "rubyXL"
base_uri = "https://itg-lan-dev.firebaseio.com/"
$firebase = Firebase::Client.new(base_uri, File.read(File.dirname(__FILE__) + "/firebase-admin.json"))

