class Webpage < ApplicationRecord
  belongs_to :customapp
  has_many :queries, class_name: 'Modelquery', foreign_key: 'webpage_id'
end
