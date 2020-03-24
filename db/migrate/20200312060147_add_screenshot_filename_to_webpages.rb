class AddScreenshotFilenameToWebpages < ActiveRecord::Migration[5.1]
  def change
    add_column :webpages, :screenshot_filename, :string
  end
end
