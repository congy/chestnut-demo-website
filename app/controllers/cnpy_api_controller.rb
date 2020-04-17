class CnpyApiController < ApplicationController
  # TODO: enable CSRF validation:
  # https://stackoverflow.com/questions/5669322/turn-off-csrf-token-in-rails-3
  skip_before_action :verify_authenticity_token, :only => [ :run ]
  #protect_from_forgery with: :exception
  def run
    # TODO parse input, model of application and webpages.
    # TODO caching.

    # Run chestnut python script
    poutput, pinfo = Open3.capture2('python3', 'chestnut/run.py') # args...
    status = 0 == pinfo.exitstatus ? 200 : 500

    # https://stackoverflow.com/a/12385656/2398020
    respond_to do |format|
      format.json { render :json => poutput, :status => status }
    end
  end
end
