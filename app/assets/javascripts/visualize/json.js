// TODO removeme.

let JSON_MODEL = {
    0: {
        'table': ['tracker'],
        'type': 'BasicArray',
        'value': {
            'fields': ['id', 'name', 'is_in_chlog', 'position', 'is_in_roadmap', 'default_status_id'],
            'nested': [{
                'table': ['tracker', 'projects'],
                'type': 'BasicArray',
                'association': {
                    'leftTable': 'project',
                    'rightFkField': 'tracker_id',
                    'assocType': 'many_to_many',
                    'leftFkField': 'project_id',
                    'rightTable': 'tracker',
                    'table': 'projects_trackers'
                },
                'value': {
                    'fields': [
                        'id', 'status', 'lft', 'rgt', 'name', 'description', 'homepage', 'is_public', 'parent_id',
                        'created_on', 'updated_on', 'inherit_members', 'default_version_id', 'default_assigned_to_id'
                    ],
                    'nested': [{
                        'keys': [],
                        'value': {
                            'fields': ['id'],
                            'nested': []
                        },
                        'table': ['projects', 'enabled_modules'],
                        'type': 'Index',
                        'id': 0,
                        'condition': "name == 'issue_tracking'"
                    }]
                }
            },
            {
                'table': ['tracker', 'issues'],
                'type': 'BasicArray',
                'association': {
                    'assocType': 'one_to_many',
                    'leftTable': 'tracker',
                    'rightFkField': 'tracker_id',
                    'rightTable': 'issue',
                    'leftFkField': 'issues_id'
                },
                'value': {
                    'fields': [
                        'id', 'subject', 'description', 'due_date', 'assigned_to_id', 'created_on', 'updated_on',
                        'start_date', 'done_ratio', 'estimated_hours', 'parent_id', 'root_id', 'lft', 'rgt',
                        'is_private', 'closed_on', 'author_id', 'priority_id', 'project_id', 'tracker_id', 'status_id'
                    ],
                    'nested': [{
                        'table': ['issues', 'status'],
                        'type': 'BasicArray',
                        'association': {
                            'assocType': 'one_to_many',
                            'leftTable': 'issue_status',
                            'rightFkField': 'status_id',
                            'rightTable': 'issue',
                            'leftFkField': 'issues_id'
                        },
                        'value': {
                            'fields': ['id', 'is_closed'],
                            'nested': []
                        }
                    }]
                }
            }]
        }
    }
};
JSON_MODEL = {
  "0": {
    "type": "BasicArray",
    "value": {
      "fields": [
        "id",
        "created_at",
        "updated_at",
        "action",
        "content",
        "channel_id",
        "user_id"
      ],
      "nested": [
        {
          "type": "BasicArray",
          "value": {
            "fields": [
              "id",
              "username"
            ],
            "nested": []
          },
          "table": [
            "activity",
            "user"
          ],
          "association": {
            "assocType": "one_to_many",
            "leftTable": "user",
            "rightTable": "activity",
            "leftFkField": "activities_id",
            "rightFkField": "user_id"
          }
        }
      ]
    },
    "table": [
      "activity"
    ]
  },
  "1": {
    "type": "Index",
    "id": 10,
    "table": [
      "activity"
    ],
    "keys": [
      {
        "key": "channel.id",
        "path": []
      },
      {
        "key": "id",
        "path": []
      }
    ],
    "condition": "(channel.id == param[channel_id]) && ((id >= 1) && (id <= 20))",
    "value": {
      "type": "ptr",
      "target": 5
    }
  },
  "2": {
    "type": "Index",
    "id": 17,
    "table": [
      "activity"
    ],
    "keys": [
      {
        "key": "channel.id",
        "path": []
      },
      {
        "key": "id",
        "path": []
      }
    ],
    "condition": "(channel.id == param[channel_id]) && (id <= param[oldest])",
    "value": {
      "type": "ptr",
      "target": 5
    }
  },
  "3": {
    "type": "BasicArray",
    "value": {
      "fields": [
        "id",
        "name",
        "created_at",
        "updated_at",
        "user_id"
      ],
      "nested": [
        {
          "type": "BasicArray",
          "value": {
            "fields": [
              "id",
              "content",
              "action",
              "created_at",
              "updated_at"
            ],
            "nested": [
              {
                "type": "BasicArray",
                "value": {
                  "fields": [
                    "id",
                    "username"
                  ],
                  "nested": []
                },
                "table": [
                  "activities",
                  "user"
                ],
                "association": {
                  "assocType": "one_to_many",
                  "leftTable": "user",
                  "rightTable": "activity",
                  "leftFkField": "activities_id",
                  "rightFkField": "user_id"
                }
              }
            ]
          },
          "table": [
            "channel",
            "activities"
          ],
          "association": {
            "assocType": "one_to_many",
            "leftTable": "channel",
            "rightTable": "activity",
            "leftFkField": "activities_id",
            "rightFkField": "channel_id"
          }
        }
      ]
    },
    "table": [
      "channel"
    ]
  },
  "4": {
    "type": "Index",
    "id": 25,
    "table": [
      "activity"
    ],
    "keys": [
      {
        "key": "id",
        "path": []
      }
    ],
    "condition": "id == param[id]",
    "value": {
      "type": "ptr",
      "target": 5
    }
  },
  "5": {
    "type": "Index",
    "id": 31,
    "table": [
      "attachment"
    ],
    "keys": [
      {
        "key": "channel.id",
        "path": []
      },
      {
        "key": "created_at",
        "path": []
      }
    ],
    "condition": "(channel.id == param[channel_id]) && ((created_at >= 0) && (created_at <= 4294967295))",
    "value": {
      "fields": [
        "id",
        "file_file_name",
        "file_content_type",
        "file_file_size",
        "message_id",
        "file_updated_at",
        "created_at",
        "updated_at",
        "user_id",
        "channel_id"
      ],
      "nested": []
    }
  },
  "6": {
    "type": "Index",
    "id": 45,
    "table": [
      "channel"
    ],
    "keys": [
      {
        "key": "id",
        "path": []
      }
    ],
    "condition": "id == param[channel_id]",
    "value": {
      "type": "ptr",
      "target": 22
    }
  }
};

// result_activity: Activity
// result_user: User

// scan step


const JSON_PLAN = {
  "type": "ExecQueryStep",
  "value": {
    "queryid": 26,
    "variables": [
      {
        "atom": false,
        "name": "result_activity",
        "type": "activity",
        "fields": []
      },
      {
        "atom": false,
        "name": "result_user",
        "type": "user",
        "fields": []
      }
    ],
    "steps": {
      "type": "ExecStepSeq",
      "value": [
        {
          "type": "ExecScanStep",
          "value": {
            "idx": 1,
            "steps": {
              "type": "ExecStepSeq",
              "value": [
                {
                  "type": "ExecSetVarStep",
                  "value": {
                    "var": "result_activity",
                    "expr": null,
                    "cond": "content like param[keyword]"
                  }
                },
                {
                  "type": "ExecScanStep",
                  "value": {
                    "idx": 29,
                    "steps": {
                      "type": "ExecStepSeq",
                      "value": [
                        {
                          "type": "ExecSetVarStep",
                          "value": {
                            "var": "result_user",
                            "expr": null,
                            "cond": null
                          }
                        }
                      ]
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  }
};
