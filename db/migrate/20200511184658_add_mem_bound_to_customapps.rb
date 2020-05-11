class AddMemBoundToCustomapps < ActiveRecord::Migration[5.1]
  def change
    add_column :customapps, :mem_bound, :float
  end
end
