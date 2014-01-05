const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;



const WindowList = new Lang.Class({
	Name: 'WindowList.WindowList',
	Extends: PanelMenu.Button,

	_init: function(){
		this.parent(0.0, 'All Windows');

        	this.statusLabel = new St.Label({ text: '\u2630' });
        	this.actor.add_actor(this.statusLabel);
        	this.updateMenu();
	},

	destroy: function() {
        	this.parent();
    	},

	
    updateMenu: function() {
        this.menu.removeAll();
        let empty_menu = true;

            let tracker = Shell.WindowTracker.get_default();

            for ( let wks=0; wks<global.screen.n_workspaces; ++wks ) {
                // construct a list with all windows
                let workspace_name = Meta.prefs_get_workspace_name(wks);
                let metaWorkspace = global.screen.get_workspace_by_index(wks);
                let windows = metaWorkspace.list_windows();             
                let sticky_windows = windows.filter(
                        function(w) {
                            return !w.is_skip_taskbar() && w.is_on_all_workspaces();
                            }
                                        );
                windows = windows.filter(
                        function(w) {
                            return !w.is_skip_taskbar() && !w.is_on_all_workspaces();
                            }
                                        );

                if(sticky_windows.length && (wks==0)) {
                    for ( let i = 0; i < sticky_windows.length; ++i ) {
                        let metaWindow = sticky_windows[i];
                        let item = new PopupMenu.PopupMenuItem(ellipsizedWindowTitle(metaWindow));
                        item.connect('activate', Lang.bind(this, function() { this.activateWindow(metaWorkspace, metaWindow); } ));
                        item._window = sticky_windows[i];
                        let app = tracker.get_window_app(item._window);
                        item._icon = app.create_icon_texture(24);
                        item.addActor(item._icon, { align: St.Align.END });
                        this.menu.addMenuItem(item);
                        empty_menu = false;
                    }
                        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                }

                if(windows.length) {
                    if(wks>0) {
                        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                    }
                    if(global.screen.n_workspaces>1) {
                        let item = new PopupMenu.PopupMenuItem(workspace_name);
                        item.actor.reactive = false;
                        item.actor.can_focus = false;
                        if(wks == global.screen.get_active_workspace().index()) {
                            item.setShowDot(true);
                        }
                        this.menu.addMenuItem(item);
                        empty_menu = false;
                    }


                    for ( let i = 0; i < windows.length; ++i ) {
                        let metaWindow = windows[i];
                        let item = new PopupMenu.PopupMenuItem(ellipsizedWindowTitle(windows[i]));
                        item.connect('activate', Lang.bind(this, function() { this.activateWindow(metaWorkspace, metaWindow); } ));
                        item._window = windows[i];
                        let app = tracker.get_window_app(item._window);
                        item._icon = app.create_icon_texture(24);
                        item.addActor(item._icon, { align: St.Align.END });
                        this.menu.addMenuItem(item);
                        empty_menu = false;
                    }
                }
            }

        if (empty_menu) {
            let item = new PopupMenu.PopupMenuItem(_("No open windows"))
            item.actor.reactive = false;
            item.actor.can_focus = false;
            this.menu.addMenuItem(item);
        }
    },

    activateWindow: function(metaWorkspace, metaWindow) {
        if(!metaWindow.is_on_all_workspaces()) { metaWorkspace.activate(global.get_current_time()); }
        metaWindow.unminimize(global.get_current_time());
        metaWindow.unshade(global.get_current_time());
        metaWindow.activate(global.get_current_time());
    },

     _onButtonPress: function(actor, event) {
        this.updateMenu();
        this.parent(actor, event);
    },

});

let _windowlist;

function ellipsizeString(s, l){
    if(s.length > l) { 
        return s.substr(0, l)+'...';
    }
    return s; 
}

function ellipsizedWindowTitle(w){
    return ellipsizeString(w.get_title(), 100);
}

function init() {
}

function enable() {
	_windowlist = new WindowList;
    	Main.panel.addToStatusArea('window-list', _windowlist, -1);
}

function disable() {
	_windowlist.destroy();
}
