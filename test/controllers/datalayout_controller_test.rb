require 'test_helper'

class DatalayoutControllerTest < ActionDispatch::IntegrationTest
  test "should get show" do
    get datalayout_show_url
    assert_response :success
  end

end
