class CreateWebpages < ActiveRecord::Migration[5.1]
  def change
    create_table :webpages do |t|
      t.integer :weight
      t.text :name
      t.references :customapp, foreign_key: true

      t.timestamps
    end
  end
end
