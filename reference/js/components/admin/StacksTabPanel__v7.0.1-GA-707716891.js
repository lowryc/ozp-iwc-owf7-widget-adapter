Ext.define("Ozone.components.admin.StacksTabPanel",{extend:"Ext.panel.Panel",alias:["widget.stackstabpanel","widget.Ozone.components.admin.StacksTabPanel"],editPanel:null,initComponent:function(){var a=this;Ext.apply(this,{layout:"fit",preventHeader:true,border:true,initDisabled:true,widgetLauncher:null,widgetEventingController:null,widgetStateHandler:null,items:[{xtype:"stacksgrid",itemId:"stacksgrid",preventHeader:true,border:false}],dockedItems:[{xtype:"toolbar",itemId:"tbStacksGridHdr",cls:"tbStacksGridHdr",dock:"top",items:[{xtype:"tbtext",itemId:"lblStacksGrid",cls:"tbStacksGridHdr",text:"Stacks"},"->",{xtype:"searchbox",listeners:{searchChanged:{fn:function(c,d){var b=this.getComponent("stacksgrid");if(b!=null){b.applyFilter(d,["name","description"])}},scope:this}}}]},{xtype:"toolbar",dock:"bottom",ui:"footer",defaults:{minWidth:80},items:[{xtype:"button",text:"Add",itemId:"addButton",handler:function(){this.onAddClicked()},scope:this},{xtype:"button",text:"Remove",itemId:"removeButton",handler:function(){var d=this.down("#stacksgrid");if(d){var c=d.getSelectionModel().getSelection();if(c&&c.length>0){var b=d.store;b.remove(c);b.on({save:{fn:function(f,e,g){b.reload()}}});b.save()}else{a.editPanel.showAlert("Error","You must select at least one stack to remove.")}}},scope:this}]}]});this.widgetStateHandler=Ozone.state.WidgetStateHandler.getInstance();this.on({activate:{scope:this,fn:function(g,b){var e=g.ownerCt;var c=g.down("#stacksgrid");c.setStore(Ext.create("Ozone.data.StackStore",g.storeCfg));var f=function(k){g.refreshWidgetLaunchMenu();if(k.action=="destroy"||k.action=="create"){var l=c.getBottomToolbar();l.doRefresh()}};c.store.proxy.callback=f;c.store.on("write",function(n,o,k,m,l){OWF.Eventing.publish(this.ownerCt.channel,{action:o,domain:this.ownerCt.domain,records:k})},this);if(c&&e){e.record=e.recordId?e.store.getAt(e.store.findExact("id",e.recordId)):undefined}if(e.record){var j=Ext.htmlEncode(Ext.util.Format.ellipsis(e.record.get("title"),25))||"Stacks";var h=g.getDockedItems('toolbar[dock="top"]')[0].getComponent("lblStacksGrid");h.setText(j)}OWF.Preferences.getUserPreference({namespace:"owf.admin.StackEditCopy",name:"guid_to_launch",onSuccess:function(k){g.guid_EditCopyWidget=k.value},onFailure:function(k){a.editPanel.showAlert("Preferences Error","Error looking up Stack Editor: "+k)}});if(c&&e){var i=e.recordId?e.recordId:-1;var d={tab:"stacks"};d[g.componentId]=i;c.setBaseParams(d);c.on({itemdblclick:{fn:function(){var k=c.getSelectionModel().getSelection();if(k&&k.length>0){for(var l=0;l<k.length;l++){g.doEdit(k[l].data.id,k[l].data.name)}}else{a.editPanel.showAlert("Error","You must select at least one stack to edit.")}},scope:this}})}},single:true}});this.on({activate:{fn:function(){var c=this.getComponent("stacksgrid");var b=c.getStore();if(b){b.load({params:{offset:0,max:b.pageSize}})}},scope:this}});this.callParent()},onAddClicked:function(b,f){var a=this.ownerCt.record,c=a.get("name")?a.get("name"):a.get("userRealName");var d=Ext.widget("admineditoraddwindow",{addType:"Stack",itemName:c,editor:this.editor,focusOnClose:this.down(),existingItemsStore:this.getComponent("stacksgrid").getStore(),searchFields:["displayName"],grid:Ext.widget("stacksgrid",{itemId:"stacksaddgrid",border:false,preventHeader:true,enableColumnHide:false,sortableColumns:false})});d.show()},doEdit:function(d,c){var a=this;var b=Ozone.util.toString({id:d,copyFlag:false});OWF.Launcher.launch({title:"$1 - "+c,titleRegex:/(.*)/,guid:this.guid_EditCopyWidget,launchOnlyIfClosed:false,data:b},function(e){if(e.error){a.editPanel.showAlert("Launch Error","Stack Editor Launch Failed: "+e.message)}})},refreshWidgetLaunchMenu:function(){if(this.widgetStateHandler){this.widgetStateHandler.handleWidgetRequest({fn:"refreshWidgetLaunchMenu"})}}});