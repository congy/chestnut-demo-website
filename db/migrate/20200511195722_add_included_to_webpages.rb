class AddIncludedToWebpages < ActiveRecord::Migration[5.1]
  def change
    add_column :webpages, :included, :boolean
  end
end
