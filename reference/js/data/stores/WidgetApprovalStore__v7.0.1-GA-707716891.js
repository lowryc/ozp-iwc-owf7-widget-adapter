Ext.define("Ozone.data.stores.WidgetApprovalStore",{extend:"Ozone.data.OWFStore",model:"Ozone.data.WidgetDefinition",alias:"store.widgetapprovalstore",sorters:[{property:"name",direction:"ASC"}],constructor:function(a){Ext.applyIf(a,{api:{read:"/widget/listUserWidgets"}});this.callParent(arguments)}});