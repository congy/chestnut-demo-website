require 'test_helper'

class EvaluateControllerTest < ActionDispatch::IntegrationTest
  test "should get show" do
    get evaluate_show_url
    assert_response :success
  end

end
