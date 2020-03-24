require 'test_helper'

class WebpageControllerTest < ActionDispatch::IntegrationTest
  test "should get show" do
    get webpage_show_url
    assert_response :success
  end

end
