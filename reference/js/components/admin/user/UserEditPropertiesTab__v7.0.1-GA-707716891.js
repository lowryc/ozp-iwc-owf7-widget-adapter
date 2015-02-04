Ext.define("Ozone.components.admin.user.UserEditPropertiesTab",{extend:"Ozone.components.PropertiesPanel",alias:["widget.usereditproperties","widget.usereditpropertiestab","widget.Ozone.components.admin.user.UserEditPropertiesTab"],cls:"usereditpropertiestab",initComponent:function(){Ext.apply(this,{title:"Properties",iconCls:"properties-tab",items:[{xtype:"textfield",name:"username",fieldLabel:Ozone.util.createRequiredLabel("User Name"),disabledCls:"properties-field-disabled",maxLength:200,allowBlank:false,disable:function(a){var b=this;if(b.rendered){b.el.addCls(b.disabledCls);b.onDisable()}b.disabled=true;if(a!==true){b.fireEvent("disable",b)}return b},itemId:"username"},{xtype:"textfield",fieldLabel:Ozone.util.createRequiredLabel("Full Name"),name:"userRealName",itemId:"userRealName",allowBlank:false,maxLength:200},{xtype:"textfield",allowBlank:true,fieldLabel:"Email",name:"email",itemId:"email",vtype:"email",maxLength:200}]});this.callParent(arguments)},initFieldValues:function(a){var c=this;var e=a?a.data:a;if(e){var f=c.getComponent("username"),d=c.getComponent("userRealName"),b=c.getComponent("email");f.setValue(e.username).originalValue=e.username;f.setDisabled(true);d.setValue(e.userRealName).originalValue=e.userRealName;b.setValue(e.email).originalValue=e.email}}});