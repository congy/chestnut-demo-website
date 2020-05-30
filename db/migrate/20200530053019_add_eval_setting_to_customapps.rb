class AddEvalSettingToCustomapps < ActiveRecord::Migration[5.1]
  def change
    add_column :customapps, :eval_setting, :integer
  end
end
