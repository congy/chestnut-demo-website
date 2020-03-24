class CustomappController < ApplicationController
  def show
	@customapp = Customapp.find_by_id(params[:id])
  end
  def edit
    @customapp = Customapp.find_by_id(params[:id])
  end
  def update
    @customapp = Customapp.find_by_id(params[:id])
	  puts "Customapp param = #{params[:customapp].inspect}"
	  params[:customapp][:webpages].each do |wid, attrib|
        @page = Webpage.find_by_id(wid)
		attrib.permit!
		if !attrib[:custom_weight].blank? and attrib[:custom_weight].to_i > 0
			@page.weight = attrib[:custom_weight].to_i
		elsif !attrib[:weight].blank? 
			@page.weight = attrib[:weight].to_i
		end
 		@page.save!
	  end
	respond_to do |format|
	  format.html do
	  	render "show"
	  end
    end
  end
end
