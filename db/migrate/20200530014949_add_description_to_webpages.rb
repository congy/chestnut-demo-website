class AddDescriptionToWebpages < ActiveRecord::Migration[5.1]
  def change
    add_column :webpages, :description, :text
  end
end
