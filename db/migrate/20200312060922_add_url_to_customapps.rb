class AddUrlToCustomapps < ActiveRecord::Migration[5.1]
  def change
    add_column :customapps, :url, :string
  end
end
