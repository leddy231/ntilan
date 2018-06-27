require "json"
require "firebase"
require "rubyXL"
base_uri = "https://itg-lan-dev.firebaseio.com/"
$firebase = Firebase::Client.new(base_uri, File.read(File.dirname(__FILE__) + "/firebase-admin.json"))
book = RubyXL::Workbook.new
sheet = book[0]
users = $firebase.get("users").body
active = $firebase.get("active").body
sheet.add_cell(0, 0, "Namn")
sheet.add_cell(0, 1, "Plats")
sheet.add_cell(0, 2, "ID")
sheet.change_column_width(0, 30)
x = 1
users.each do |token, user|
	if user["tables"]
		if user["tables"][active]
			*, seat = user["tables"][active].split("-")
			sheet.add_cell(x, 0, user["name"])
			sheet.add_cell(x, 1, seat.to_i)
			sheet.add_cell(x, 2, token)
			x += 1
		end
	end
end
book.write("./lanLista.xlsx")
