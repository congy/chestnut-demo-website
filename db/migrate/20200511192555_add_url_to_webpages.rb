class AddUrlToWebpages < ActiveRecord::Migration[5.1]
  def change
    add_column :webpages, :url, :string
  end
end
