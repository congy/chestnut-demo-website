class CnpyApiController < ApplicationController
  # TODO: enable CSRF validation:
  # https://stackoverflow.com/questions/5669322/turn-off-csrf-token-in-rails-3
  skip_before_action :verify_authenticity_token, :only => [ :run ]
  #protect_from_forgery with: :exception
  def run
    # TODO parse input, model of application and webpages.
    # TODO caching.
    
    # Argument parsing.
    args = [ '--scale', '0' ]
    unless params[:single_query].nil?
      args.push('--single_query', params[:single_query])
    end

    # Run chestnut python script
    poutput, pinfo = Open3.capture2('python3', 'chestnut/run.py', *args) # ...
    status = 0 == pinfo.exitstatus ? 200 : 500

    # https://stackoverflow.com/a/12385656/2398020
    respond_to do |format|
      format.json { render :json => poutput, :status => status }
    end
  end
  def get_tsv
    # TODO: hack since files are not thread safe.
    path = './chestnut/repo/benchmark/kandan/data/kandan_lg/*.tsv'
    data = Dir.glob(path).map do |file_path|
      name = file_path[file_path.rindex('/') + 1 .. -5]
      puts(file_path.rindex('/') + 1, file_path)

      rows = File.open(file_path).map { |line| line.strip.split('|') }
      head = rows.shift()
      [
        name, 
        {
          :header => head,
          :rows => rows,
        }
      ]
    end
    data = data.to_h

    respond_to do |format|
      format.json { render :json => data, :status => 200 }
    end
  end
end