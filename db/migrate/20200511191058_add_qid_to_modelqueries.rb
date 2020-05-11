class AddQidToModelqueries < ActiveRecord::Migration[5.1]
  def change
    add_column :modelqueries, :qid, :string
  end
end
