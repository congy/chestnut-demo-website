class CreateModelqueries < ActiveRecord::Migration[5.1]
  def change
    create_table :modelqueries do |t|
      t.text :query
      t.boolean :is_read
      t.references :webpage, foreign_key: true

      t.timestamps
    end
  end
end
