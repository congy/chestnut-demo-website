class DatalayoutController < ApplicationController
  def show
	@customapp = Customapp.find_by_id(params[:id])
	app_detail = @customapp.to_json.to_s

	#ctx = ZMQ::Context.new
  #	@rep_sock = ctx.socket(ZMQ::REQ)
  #	rc = @rep_sock.connect('tcp://127.0.0.1:5555')
  #	t1 = Time.now
  #	@rep_sock.send_string(app_detail)
  #	data = ''
  #	@rep_sock.recv_string(data)	
	#puts "Hello! received #{data}"
	#@message = data
	#@rep_sock.close()

  end

  def show2
    @customapp = Customapp.find_by_id(params[:id])
  end
end
