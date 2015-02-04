Ext.define("Ozone.components.layout.BufferedCardLayout",{extend:"Ext.layout.container.Card",alias:"layout.bufferedcard",deferredRender:true,type:"bufferedcard",cardBufferSize:10,constructor:function(a){this.callParent(arguments);this.initCardBuffers()},initCardBuffers:function(){if(!this.cardBuffer){this.cardBuffer=Ext.create("Ext.util.MixedCollection")}if(!this.removedCardConfigBuffer){this.removedCardConfigBuffer=Ext.create("Ext.util.MixedCollection")}},afterRemove:function(a){this.callParent([a]);if(!a.dontRemove){this.cardBuffer.remove(a);this.removedCardConfigBuffer.remove(a)}},setActiveItem:function(k){var g=this,a=g.owner,c=g.activeItem,l;var h=k;k=g.parseActiveItem(k);l=a.items.indexOf(k);if(!k){k=this.removedCardConfigBuffer.get(h);var e=Ext.create("Ozone.data.StateStore",{storeId:k.config.guid,data:[]});k.stateStore=e;l=a.items.items.length;k=a.add(k)}var j=this.cardBuffer.indexOf(k);if(j>-1){this.cardBuffer.removeAt(j)}this.cardBuffer.add(k);if(l==-1){l=a.items.items.length;a.add(k)}if(k){if(!k.rendered){g.renderItem(k,g.getRenderTarget(),a.items.length);g.configureItem(k,0)}g.activeItem=k;if(k.fireEvent("beforeactivate",k,c)===false){return false}if(c&&c.fireEvent("beforedeactivate",c,k)===false){return false}if(g.sizeAllCards){g.onLayout()}else{g.setItemBox(k,g.getTargetBox())}g.owner.suspendLayout=true;if(c){if(g.hideInactive){c.hide()}c.fireEvent("deactivate",c,k)}var f=this.cardBuffer.getCount()-this.cardBufferSize;if(f>0){for(var d=0;d<f;d++){var b=this.cardBuffer.getAt(d);if(b.rendered){this.removedCardConfigBuffer.add(b.initialConfig);b.dontRemove=true;b.destroy();b.dontRemove=false}this.cardBuffer.removeAt(d)}}g.owner.suspendLayout=false;if(k.hidden){k.show();delete k.deferLayout}else{g.onLayout()}k.fireEvent("activate",k,c);return k}return false}});