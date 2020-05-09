DELETE FROM customapps;
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='customapps';
INSERT INTO customapps (name, description, url, created_at, updated_at) VALUES ("Kandan", "Chatting website like Slack", "https://github.com/kandanapp/kandan", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO customapps (name, description, url, created_at, updated_at) VALUES ("Huginn", "Scraping website", "https://github.com/huginn/huginn", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO customapps (name, description, url, created_at, updated_at) VALUES ("Redmine", "Project management website like GitHub", "https://github.com/redmine/redmine", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
DELETE FROM webpages;
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='webpages';
INSERT INTO webpages (name, weight, custom_weight, customapp_id, screenshot_filename, created_at, updated_at) VALUES ("page1", 0, 0, 1, "kandan1.png", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, weight, custom_weight, customapp_id, screenshot_filename, created_at, updated_at) VALUES ("page2", 0, 0, 1, "kandan2.png", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, weight, custom_weight, customapp_id, screenshot_filename, created_at, updated_at) VALUES ("page3", 0, 0, 1, "kandan3.png", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
DELETE FROM modelqueries;
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='modelqueries';
INSERT INTO modelqueries (query, webpage_id, created_at, updated_at) VALUES ("Activities.where(:channel_id=>params[:channel_id])#.includes(:user).order(‘id’)#.where(‘id < ?’, params[:oldest])#.limit(40)  ", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, created_at, updated_at) VALUES ("Activity.order(:id)#.where(:channel_id=>params[:channel_id]).limit(1)  ", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, created_at, updated_at) VALUES ("Channel#.includes(:activities => :users)#.all  ", 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
.mode column
.headers on
