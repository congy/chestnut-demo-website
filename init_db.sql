DELETE FROM customapps;
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='customapps';
INSERT INTO customapps (name, description, mem_bound, url, created_at, updated_at) VALUES ("Kandan", "Chatting website like Slack", 1.7, "https://github.com/kandanapp/kandan", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO customapps (name, description, mem_bound, url, created_at, updated_at) VALUES ("Huginn", "Scraping website", 1.5, "https://github.com/huginn/huginn", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO customapps (name, description, mem_bound, url, created_at, updated_at) VALUES ("Redmine", "Project management website like GitHub", 1.2, "https://github.com/redmine/redmine", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

DELETE FROM webpages;
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='webpages';
INSERT INTO webpages (name, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page1: activity#index", "https://kandan.com/channels/1/activities", 0, 0, 1, "kandan1.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page2: main#index", "https://kandan.com/", 0, 0, 1, "kandan2.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page3: activity#show", "https://kandan.com/channels/1/activities/1", 0, 0, 1, "kandan3.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page4: attachment#index", "https://kandan.com/attachments", 0, 0, 1, "kandan3.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page5: main#search", "https://kandan.com/search", 0, 0, 1, "kandan3.png", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page6: admin#index", "https://kandan.com/admin/", 0, 0, 1, "kandan3.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page7: channel#index", "https://kandan.com/channels", 0, 0, 1, "kandan3.png", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page8: channel#show", "https://kandan.com/channels/1", 0, 0, 1, "kandan3.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

DELETE FROM modelqueries;
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='modelqueries';
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("channel.activities#.includes(:user,'id, username')#.order(‘id’)#.where(‘id < ?’, params[:oldest])#.limit(40)  ", 1, "q_ai_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("channel.activities#.order(:id).limit(1)  ", 1, "q_ai_3", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Channel#.includes(:activities => :users)#.all  ", 2, "q_mi_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("User#.where('id != ?', params[:user_id])  ", 6, "q_di_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Activity#.find_by_id(params[:id])  ", 3, "q_as_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("channel.attachments#.order('created_at')  ", 4, "q_ti_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Activity#.includes(:user)#.where('LOWER(content) LIKE ?', param[:query])  ", 5, "q_ms_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Channel#.find_by_id(params[:id])#.activities#.order('id').includes(:user)#Channel.find_by_id(params[:id])#.activities.count  ", 7, "q_ci_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Channel#.where('LOWER(name) = ?', params[:name].downcase)  ", 8, "q_cs_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
.mode column
.headers on
