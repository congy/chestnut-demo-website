require 'test_helper'

class CustomappControllerTest < ActionDispatch::IntegrationTest
  test "should get show" do
    get customapp_show_url
    assert_response :success
  end

end
