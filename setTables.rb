










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
base_uri = "https://itg-lan-dev.firebaseio.com/"
$firebase = Firebase::Client.new(base_uri, File.read(File.dirname(__FILE__) + "/firebase-admin.json"))
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
$firebase.set("lans/vor2018/sections", j)
puts  $firebase.get("lans/vor2018/sections").body
