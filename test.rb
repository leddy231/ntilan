require "firebase"
require "mini-heroku"

MH.loadEnvironment
$firebase_web_config = MH.env("firebase_web_config")
$firebase_server_config = MH.env("firebase_server_admin_config")
$firebase = Firebase::Client.new($firebase_web_config["databaseURL"], $firebase_server_config.to_json)
$active = $firebase.get("active").body


lan = $firebase.get("lans/#{$active}/").body
users = $firebase.get("users").body
tables = []
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
    tables << newSection
end
data = tables.to_json
puts data