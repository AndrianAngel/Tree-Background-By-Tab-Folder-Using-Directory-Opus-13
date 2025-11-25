// Tree Background Based on Active Tab
// Changes folder tree background when you navigate to different folders

// **************************************************************************
// INITIALIZE SCRIPT
// **************************************************************************
function OnInit(initData)
{
	initData.name 					= "Tree Background by Tab";
	initData.version 				= "1.1";
	initData.copyright 				= "(c) 2024";
	initData.desc 					= "Changes tree background based on active tab folder";
	initData.default_enable 		= true;
	initData.min_version 			= "13.10";

	// SETTINGS
	initData.config = DOpus.Create.OrderedMap;
	initData.config_desc = DOpus.Create.OrderedMap;

	// Default background
	initData.config['Default Image'] = 'C:\\Users\\%username%\\Pictures\\default.jpg';
	initData.config_desc(['Default Image']) = 
		'Default background image (used when no folder match)';

	// How to fit the image
	initData.config['Fit Mode'] = DOpus.Create.Vector(1, 'aspectfit (shows full image)', 'aspectfill (fills tree)', 'center (original size)', 'stretch');
	initData.config_desc(['Fit Mode']) = 
		'How to display the image:\n' +
		'aspectfit - Shows ENTIRE image without cutting (RECOMMENDED)\n' +
		'aspectfill - Fills tree completely (may crop edges)\n' +
		'center - Original size, centered\n' +
		'stretch - Stretches to fill';

	// Opacity (transparency)
	initData.config['Opacity'] = 25;
	initData.config_desc(['Opacity']) = 
		'Transparency: 1 (invisible) to 100 (solid)\n' +
		'Recommended: 20-30 for good readability';

	// Folder mappings (20 locations)
	for (var i = 1; i <= 20; i++)
	{
		var defaultPath = '';
		var defaultImage = '';
		
		// Set defaults for first 3 folders
		if (i == 1) {
			defaultPath = 'C:\\Users\\%username%\\Documents';
			defaultImage = 'C:\\Users\\%username%\\Pictures\\documents.jpg';
		} else if (i == 2) {
			defaultPath = 'C:\\Users\\%username%\\Downloads';
			defaultImage = 'C:\\Users\\%username%\\Pictures\\downloads.jpg';
		} else if (i == 3) {
			defaultPath = 'C:\\Users\\%username%\\Pictures';
			defaultImage = 'C:\\Users\\%username%\\Pictures\\photos.jpg';
		}
		
		initData.config['Folder ' + i + ' Path'] = defaultPath;
		initData.config_desc(['Folder ' + i + ' Path']) = 'Folder ' + i + ' path to monitor';
		
		initData.config['Folder ' + i + ' Image'] = defaultImage;
		initData.config_desc(['Folder ' + i + ' Image']) = 'Image for Folder ' + i;
	}

	// Match subfolders option
	initData.config['Match Subfolders'] = true;
	initData.config_desc(['Match Subfolders']) = 
		'If enabled, subfolders will use parent folder image\n' +
		'Example: C:\\Users\\Name\\Documents\\Work uses Documents image';
}

// **************************************************************************
// Called when a tab changes (navigation, activation, etc.)
// **************************************************************************
function OnActivateTab(activateTabData)
{
	UpdateTreeBackground(activateTabData.newtab);
}

function OnAfterFolderChange(afterFolderChangeData)
{
	UpdateTreeBackground(afterFolderChangeData.tab);
}

// **************************************************************************
// Update tree background based on current tab
// **************************************************************************
function UpdateTreeBackground(tab)
{
	if (!tab) return;

	var currentPath = String(tab.path);
	var imagePath = FindImageForPath(currentPath);

	if (imagePath && DOpus.FSUtil.Exists(imagePath))
	{
		SetTreeBackground(imagePath);
	}
}

// **************************************************************************
// Find which image to use for the current path
// **************************************************************************
function FindImageForPath(currentPath)
{
	currentPath = currentPath.toLowerCase();
	var resolvedCurrent = String(DOpus.FSUtil.Resolve(currentPath)).toLowerCase();

	// Check each configured folder (now 20 instead of 5)
	for (var i = 1; i <= 20; i++)
	{
		var folderPath = String(Script.config['Folder ' + i + ' Path']);
		var imagePath = String(Script.config['Folder ' + i + ' Image']);

		if (!folderPath || folderPath == '') continue;
		if (!imagePath || imagePath == '') continue;

		var resolvedFolder = String(DOpus.FSUtil.Resolve(folderPath)).toLowerCase();

		// Exact match
		if (resolvedCurrent == resolvedFolder)
		{
			return imagePath;
		}

		// Subfolder match (if enabled)
		if (Script.config['Match Subfolders'])
		{
			// Check if current path starts with the configured folder path
			if (resolvedCurrent.indexOf(resolvedFolder) == 0)
			{
				// Make sure it's actually a subfolder (not just similar name)
				var char = resolvedCurrent.charAt(resolvedFolder.length);
				if (char == '\\' || char == '/')
				{
					return imagePath;
				}
			}
		}
	}

	// No match found - use default
	return String(Script.config['Default Image']);
}

// **************************************************************************
// Set the tree background image
// **************************************************************************
function SetTreeBackground(imagePath)
{
	imagePath = String(DOpus.FSUtil.Resolve(imagePath));

	if (!DOpus.FSUtil.Exists(imagePath))
	{
		DOpus.Output('Image not found: ' + imagePath);
		return;
	}

	// Check if this is already the current background
	if (DOpus.vars.Exists('currentTreeBg') && 
		String(DOpus.vars.Get('currentTreeBg')).toLowerCase() == imagePath.toLowerCase())
	{
		return; // Already set, no need to change
	}

	var cmd = DOpus.Create().Command;
	
	// Get fit mode
	var fitMode = 'aspectfit';
	var fitModeValue = Script.config['Fit Mode'];
	switch (fitModeValue)
	{
		case 0: fitMode = 'aspectfit'; break;
		case 1: fitMode = 'aspectfill'; break;
		case 2: fitMode = 'center'; break;
		case 3: fitMode = 'stretch'; break;
	}

	// Get opacity
	var opacity = Number(Script.config['Opacity']);
	if (opacity < 1) opacity = 1;
	if (opacity > 100) opacity = 100;

	// Set background for folder tree
	var command = 'Set BACKGROUNDIMAGE tree:"' + imagePath + '" BACKGROUNDIMAGEOPTS=' + fitMode + ',opacity:' + opacity;
	cmd.AddLine(command);
	cmd.SetModifier("noprogress");
	cmd.Run();

	// Remember current background
	DOpus.vars.Set('currentTreeBg', imagePath);

	// Get filename for output
	var pathObj = DOpus.FSUtil.NewPath(imagePath);
	DOpus.Output('Tree background changed: ' + pathObj.filepart);
}