Ext.define("Ozone.components.dashboarddesigner.DraggableView",{extend:"Ozone.components.focusable.FocusableView",alias:["widget.dashboarddesignerbaselayoutdraggableview","widget.Ozone.components.dashboarddesigner.DraggableView"],initComponent:function(){var a=this;a.on("viewready",a.setup,a,{single:true});a.on("destroy",a.cleanUp,a);a.on("keyup",a.keyup,a,{element:"el"});a.addEvents("enterpress");a.enableBubble(["enterpress"]);a.callParent(arguments)},keyup:function(b,d){var c=d,a=this.getRecord(c);if(b.getKey()===Ext.EventObject.ENTER){this.fireEvent("enterpress",this,a,c)}},setup:function(a){var c=this;c.tip=Ext.create("Ext.tip.ToolTip",{target:a.el,delegate:a.itemSelector,trackMouse:true,renderTo:a.el,mouseOffset:[0,10],listeners:{beforeshow:function b(d){d.update(a.getRecord(d.triggerElement).get("displayName"))}}});c.dragZone=new Ext.dd.DragZone(a.getEl(),{isTarget:false,dragSourceView:a,ddGroup:"dashboard-designer",animRepair:false,getDragData:function(d){var e=d.getTarget(this.dragSourceView.itemSelector);if(e){return{ddel:e.cloneNode(true),draggedRecord:a.getRecord(e)}}}})},cleanUp:function(){this.tip.destroy();this.dragZone.destroy()}});