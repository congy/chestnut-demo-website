DELETE FROM customapps;
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='customapps';
INSERT INTO customapps (name, description, mem_bound, url, created_at, updated_at) VALUES ("Kandan", "Chatting website like Slack", 1.7, "https://github.com/kandanapp/kandan", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO customapps (name, description, mem_bound, url, created_at, updated_at) VALUES ("Redmine", "Project management website like GitHub", 1.2, "https://github.com/redmine/redmine", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

DELETE FROM webpages;
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='webpages';
INSERT INTO webpages (name, description, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page1:", "showing one channel with all activities", "https://kandan.com/channels", 1, 0, 1, "kandan_channel.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, description, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page2:", "showing all channels with all activities", "https://kandan.com/", 1, 0, 1, "kandan_main.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, description, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page3:", "search activity by key word", "https://kandan.com/search", 1, 0, 1, "kandan_search.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, description, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page4:", "show activities", "https://kandan.com/channels/1/activities", 1, 0, 1, "kandan_main2.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, description, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page5:", "show one single activity", "https://kandan.com/channels/1/activities/1", 1, 0, 1, "kandan_activity.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, description, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page6:", "list all attachments", "https://kandan.com/attachments", 1, 0, 1, "kandan_attachment.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, description, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page7:", "show all users for administrator", "https://kandan.com/admin/", 1, 0, 1, "kandan_user.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, description, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page8:", "show the information of one channel", "https://kandan.com/channels/1", 1, 0, 1, "kandan_onechannel.jpg", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO webpages (name, description, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page1: ", "show all projects", "https://redmine.com/projects", 1, 0, 2, "redmine_project_index.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, description, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page2: ", "show all activities like create or update projects and issues", "https://redmine.com/activity", 1, 0, 2, "redmine_activity_index.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, description, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page3: ", "show all issues", "https://redmine.com/issues", 1, 0, 2, "redmine_issue_index.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO webpages (name, description, url, weight, custom_weight, customapp_id, screenshot_filename, included, created_at, updated_at) VALUES ("page4: ", "show issues of a project", "https://redmine.com/projects/pKHEDoiLrcslcviFLSIRsotXET/issues", 1, 0, 2, "redmine_project_show.png", 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

DELETE FROM modelqueries;
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='modelqueries';
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("channel.activities#.includes(:user,'id, username')#.order(‘id’)#.where(‘id < ?’, params[:oldest])#.limit(40)  ", 4, "q_ai_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("channel.activities#.order(:id).limit(1)  ", 4, "q_ai_3", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Channel#.includes(:activities => :users)#.all  ", 2, "q_mi_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("User#.where('id != ?', params[:user_id])  ", 7, "q_di_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Activity#.find_by_id(params[:id])  ", 5, "q_as_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("channel.attachments#.order('created_at')  ", 6, "q_ti_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Activity#.includes(:user)#.where('LOWER(content) LIKE ?', param[:query])  ", 3, "q_ms_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Channel#.find_by_id(params[:id])#.activities#.order('id').includes(:user)#Channel.find_by_id(params[:id])#.activities.count  ", 1, "q_ci_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Channel#.where('LOWER(name) = ?', params[:name].downcase)  ", 8, "q_cs_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Project#.where(status != 9)#.where('lft < ? AND rgt > ?', params[:lft], params[:rgt])#.includes(:enabled_modules)#.order('lft')", 10, "q_ai_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Issue#.joins(:project)#.where('projects.status != 9')#.where('exists(select 1 from enabled_modules #where project_id=projects.id #AND name = 'issue_tracking')')#.where(status => 'is_closed')#.order('id').limit(25)", 11, "q_ii_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Project#.where('status = 1')#.where('status != 9')#.joins(:members => :user)#.where('users._id = ?', params[:user_id])", 11, "q_ii_2", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Project#.where('status = 1')#.order(:lft)", 9, "q_pi_0", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO modelqueries (query, webpage_id, qid, created_at, updated_at) VALUES ("Project#.where(id => params[:project_id])#.includes(:enabled_modules)#.preload(:members, members.user.status=>1)", 12, "q_ps_1", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);





.mode column
.headers on
