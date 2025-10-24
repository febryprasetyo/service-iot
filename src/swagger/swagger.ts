import 'dotenv/config';

let data = {
  "swagger": "2.0",
  "info": {
      "description": "Service LCTS API",
      "version": "1.0.0",
      "title": "LCTS API"
  },
  "schemes": ["http"],
  "host": process.env.HOST,
  "basePath": "/api",
  "securityDefinitions": {
    "Bearer": {
        "type": "apiKey",
        "name": "Authorization",
        "in": "header"
    }
  },
  "paths" : {
        "/auth/create-token" : {
            "post" : {
                "summary" : "Create Token",
                "description": "Create Token",
                "produces": ["application/json"],
                "consumes": ["application/json"],
                "parameters": [
                    {
                        "in": "body",
                        "name": "body",
                        "description": "Parameter Create Token",
                        "required": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "client_id" : {
                                    "required": true,
                                    "type": "string"
                                },
                                "secret_key" : {
                                    "required": true,
                                    "type": "string"
                                }
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "success": {
                                    "type": "boolean"
                                },
                                "access_token": {
                                    "type": "string"
                                },
                                "expires_in": {
                                    "type": "integer"
                                },
                                "type": {
                                    "type": "string"
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Invalid status value",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "success": {
                                    "type": "boolean",
                                    "default": false
                                },
                                "message": {
                                    "type": "string"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/sync/create-so" : {
            "post" : {
                "security": [
                    {"Bearer": []}
                ],
                "summary" : "Create Shipment Order",
                "description": "Create Shipment Order",
                "produces": ["application/json"],
                "consumes": ["application/json"],
                "parameters": [
                    {
                        "in": "body",
                        "name": "body",
                        "description": "Parameter Create Shipment Order",
                        "required": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "order_desc": {
                                    "type": "string"
                                },
                                "etd": {
                                    "type": "string",
                                    "format": "date"
                                },
                                "eta": {
                                    "type": "string",
                                    "format": "date"
                                },
                                "project_code": {
                                    "type": "string"
                                },
                                "division_code": {
                                    "type": "string"
                                },
                                "created_by": {
                                    "type": "string"
                                },
                                "currency": {
                                    "type": "string"
                                },
                                "tot_amount": {
                                    "type": "integer"
                                },
                                "tot_volume": {
                                    "type": "integer"
                                },
                                "tot_weight": {
                                    "type": "integer"
                                },
                                "insurance_vendor_name": {
                                    "type": "string"
                                },
                                "insurance_amount": {
                                    "type": "integer"
                                },
                                "insurance_cover_code": {
                                    "type": "string"
                                },
                                "transport_vendor_id": {
                                    "type": "string"
                                },
                                "transport_vendor_name": {
                                    "type": "string"
                                },
                                "transport_amount": {
                                    "type": "integer"
                                },
                                "shipment_planning": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "shipment_name": {
                                                "type": "string"
                                            },
                                            "etd": {
                                                "type": "string",
                                                "format": "date"
                                            },
                                            "eta": {
                                                "type": "string",
                                                "format": "date"
                                            },
                                            "contract_no": {
                                                "type": "string"
                                            },
                                            "contract_amount": {
                                                "type": "integer"
                                            },
                                            "resources": {
                                                "type": "array",
                                                "items": {
                                                    "type": "object",
                                                    "properties": {
                                                        "qty": {
                                                            "type": "integer"
                                                        },
                                                        "item_code": {
                                                            "type": "string"
                                                        },
                                                        "item_name": {
                                                            "type": "string"
                                                        },
                                                        "item_price": {
                                                            "type": "integer"
                                                        },
                                                        "uom": {
                                                            "type": "string"
                                                        },
                                                        "size_uom": {
                                                            "type": "string"
                                                        },
                                                        "weight_uom": {
                                                            "type": "string"
                                                        },
                                                        "total_package": {
                                                            "type": "integer"
                                                        },
                                                        "incoterm_id": {
                                                            "type": "string"
                                                        },
                                                        "incoterm_location": {
                                                            "type": "string"
                                                        },
                                                        "pickup_address": {
                                                            "type": "string"
                                                        },
                                                        "pickup_google_address": {
                                                            "type": "string"
                                                        },
                                                        "pickup_lat": {
                                                            "type": "string"
                                                        },
                                                        "pickup_long": {
                                                            "type": "string"
                                                        },
                                                        "pickup_pic": {
                                                            "type": "string"
                                                        },
                                                        "pickup_phone": {
                                                            "type": "string"
                                                        },
                                                        "pickup_phone_code": {
                                                            "type": "string"
                                                        },
                                                        "delivery_address": {
                                                            "type": "string"
                                                        },
                                                        "delivery_google_address": {
                                                            "type": "string"
                                                        },
                                                        "delivery_lat": {
                                                            "type": "string"
                                                        },
                                                        "delivery_long": {
                                                            "type": "string"
                                                        },
                                                        "delivery_pic": {
                                                            "type": "string"
                                                        },
                                                        "delivery_phone": {
                                                            "type": "string"
                                                        },
                                                        "delivery_phone_code": {
                                                            "type": "string"
                                                        },
                                                        "shipment_note": {
                                                            "type": "string"
                                                        },
                                                        "ready_date": {
                                                            "type": "string"
                                                        },
                                                        "project_note": {
                                                            "type": "string"
                                                        },
                                                        "long": {
                                                            "type": "integer"
                                                        },
                                                        "width": {
                                                            "type": "integer"
                                                        },
                                                        "height": {
                                                            "type": "integer"
                                                        },
                                                        "weight": {
                                                            "type": "integer"
                                                        },
                                                        "cbm": {
                                                            "type": "integer"
                                                        },
                                                        "volume": {
                                                            "type": "integer"
                                                        },
                                                        "land_sea_volume": {
                                                            "type": "integer"
                                                        },
                                                        "air_volume": {
                                                            "type": "integer"
                                                        },
                                                        "risks": {
                                                            "type": "array",
                                                            "items": {
                                                                "type": "object",
                                                                "properties": {
                                                                    "probability_rating": {
                                                                        "type": "integer"
                                                                    },
                                                                    "effect_rating": {
                                                                        "type": "integer"
                                                                    },
                                                                    "category": {
                                                                        "type": "string"
                                                                    },
                                                                    "risk_name": {
                                                                        "type": "string"
                                                                    },
                                                                    "risk_cause": {
                                                                        "type": "string"
                                                                    },
                                                                    "risk_effect": {
                                                                        "type": "string"
                                                                    },
                                                                    "risk_level": {
                                                                        "type": "string"
                                                                    },
                                                                    "pic": {
                                                                        "type": "string"
                                                                    },
                                                                    "mitigation": {
                                                                        "type": "string"
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        "opportunities": {
                                                            "type": "array",
                                                            "items": {
                                                                "type": "object",
                                                                "properties": {
                                                                    "cost": {
                                                                        "type": "integer"
                                                                    },
                                                                    "benefit_value": {
                                                                        "type": "integer"
                                                                    },
                                                                    "proposed_by": {
                                                                        "type": "string"
                                                                    },
                                                                    "probability": {
                                                                        "type": "string"
                                                                    },
                                                                    "area": {
                                                                        "type": "string"
                                                                    },
                                                                    "obstacle": {
                                                                        "type": "string"
                                                                    },
                                                                    "opportunity_name": {
                                                                        "type": "string"
                                                                    },
                                                                    "benefit_name": {
                                                                        "type": "string"
                                                                    },
                                                                    "rtl": {
                                                                        "type": "string"
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "success": {
                                    "type": "boolean"
                                },
                                "message": {
                                    "type": "string"
                                },
                                "data": {
                                    "type": "object",
                                    "properties": {
                                        "order_code": {
                                            "type": "string"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "Invalid status value",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "success": {
                                    "type": "boolean",
                                    "default": false
                                },
                                "message": {
                                    "type": "string"
                                }
                            }
                        }
                    }
                }
            }
        }
  }
}

export = data