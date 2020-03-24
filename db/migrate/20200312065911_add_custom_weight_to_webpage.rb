class AddCustomWeightToWebpage < ActiveRecord::Migration[5.1]
  def change
    add_column :webpages, :custom_weight, :integer
  end
end
