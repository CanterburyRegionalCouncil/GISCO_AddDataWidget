# GISCO Add Data Widget
Widget developed for Web AppBuilder for ArcGIS that allows user to add additional datasets to the current map.

Functionality that widget includes:  

- Search for and Add Layers to the current map that are registered with a Portal for ArcGIS (Portal) / ArcGIS Online (AGOL)
- Search for and Add Layers to the current map from an ArcGIS Server

**Developed By:**  
[GBS](http://gbs.kiwi "GBS") on behalf of the Ministry of Primary Industries.  Code made available to the GIS Council Consortium in April 2016.

**Widget Version:**  
1.4

## Sections

* [Features](#features)
* [Requirements](#requirements)
* [Instructions](#instructions)
* [Resources](#resources)
* [Issues](#issues)
* [Contributing](#contributing)
* [Licensing](#licensing)

## Features
The Widget Repository currently includes:

-  the source code for the Add Data Widget

## Requirements
Requires Web AppBuilder for ArcGIS version 1.3

## Instructions
Deploying Widget.

To use the widgets with you should copy the contents of the src folder to the stemapp/widget directory. This is located in %webappbuilder_install%/client directory.

For more information about configuring the widget for use and its resources on developing modifying widgets please visit the [Readme.md](/docs/Readme.md) file in the documentation folder.

## Resources
None

## Issues

* Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing
All development work is to be performed in a branch and when ready for release committed to master.  Your code is required to adhere to coding rules using JS Hint and JSCS there is a .jshintrc file and .jscs file included in the root folder which enforces these styles.

We follow the "fork-and-pull" Git workflow.  
1. Fork the repo on GitHub  
2. Commit changes to a branch in your fork  
3. Pull request "upstream" with your changes  
4. Merge changes in to "upstream" repo

NOTE: Be sure to merge the latest from "upstream" before making a pull request!

#### Contributing code written by others ####
Please do not contribute code you did not write yourself, unless you are certain you have the legal ability to do so. Also ensure all code contributed can be licensed under the [Creative Commons Attribution-ShareAlike 3.0 New Zealand](https://creativecommons.org/licenses/by-sa/3.0/nz/) licence.

## Branching and Releases

#### Branches ####
- MASTER - This branch contains the current stable release of this widget as specified in this document.
- Development - This branch contains the working copy of the widget subject to any current development.  Note that this branch may not always contain stable fully tested or stable release of the application.    

#### Releases ####
<table>
	<tr>
		<th>Release</th><th>Date</th><th>WAB Version</th><th>Changes</th>
	</tr>
	<tr>
		<td>1.4</td><td>5 April 2016</td><td>1.3</td><td>Initial Release</td>
	</tr>
</table>


## Licensing

Copyright 2016 MPI

Licensed under a [Creative Commons Attribution-ShareAlike 3.0 New Zealand](https://creativecommons.org/licenses/by-sa/3.0/nz/) licence (the "Licence");
you may not use this file except in compliance with the Licence.
You may obtain a copy of the Licence at

   [https://creativecommons.org/licenses/by-sa/3.0/nz/legalcode](https://creativecommons.org/licenses/by-sa/3.0/nz/legalcode "https://creativecommons.org/licenses/by-sa/3.0/nz/legalcode")

Unless required by applicable law or agreed to in writing, software
distributed under the Licence is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the Licence.