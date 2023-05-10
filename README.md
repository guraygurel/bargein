BargeIn is an electronJS based application that provides security bypasses for testing purposes. Not to be used to connect to real sites. Intended only for design environments.

In a design environment, there are times when we want to bypass https certificate warnings or errors like self-signed certificates, expired certificates, reused certificates, etc. Modern browsers either block access or they require several "proceed" buttons to be pressed before they let you in to the page. This becomes an issue especially if you are testing several systems with such certificates.

![Firefox Warning](../assets/firefoxWarning.png?raw=true)

![Firefox Failure](../assets/firefoxFailure.png?raw=true)

BargeIn is designed to `ignore-certificate-errors` and `allow-insecure-localhost`. It accepts a `config.json` file that includes definitions for a homepage. The path of the config file is determined by `electron-store` and is shown in the startup page as shown below:
><h2>Use it at your own risk</h2>
>    <p>This electronjs package provides security bypasses for testing purposes. Not to be used to connect to real sites. Intended for design environments only.</p>
>    <p>If you choose to proceed,
>      <ul>
>        <li>This program will look for the file: C:\Users\SkyNet\AppData\Roaming\bargein\config.json. Do not proceed unless you trust the contents of this file.</li>
>        <li>The program may create links according to the content of this file</li>
>        <li>It may run external scripts on the next page or any of the links you choose to follow</li>
>        <li>It will not show warnings about security certificates. This means that your connection to any of the linked pages may not be private</li>
>        <li>External scripts may perform actions on your behalf such as filling form fields, clicking a button or logging in.</li>
>        <li>Any information you submit or receive through this program may be compromised.</li>
>      </ul>
>    </p>
>    <a href="#">I understand and want to proceed</a>

If the user clicks on the _I understand and want to proceed_ link, the homepage will be created based on the config.json file. This config file is not included in the distribution and must be written & maintained by users.

**CAUTION**: This file is stored as plain-text. In other words, any information you put into the configuration file may be visible to others. Please, **DO NOT USE THIS APPLICATION** if this does not work for you.

**CAUTION#2**: BargeIn appends a parameter, `?BargeInINDEX=`, to the uris given in the config file. This may cause issues if the target uri is processing uri parameters.

Below is a sample config.json file. 

        {
            "version": "1.0.0",
            "msg": "<h1>Design Test Page</h1><p>Please select a system to login</p>",
            "targettypes" :
            {
                "sut" : {
                    "name": "sut",
                    "user": "admin",
                    "pass": "admin",
                    "uriactions":
                    [
                        {
                            "uri":"index.html",
                            "actioncode": 
                            "var user = document.getElementById('user');" +
                            "var pwd = document.getElementById('pwd');"+
                            "var login = document.getElementById('login');"+
                            "if (user !== null) user.value='${target.user}';"+
                            "if(pwd !== null) pwd.value='${target.pass}';"+
                            "if (login !== null) login.click();"
                        },
                        {	
                            "uri":"admin.html",
                            "actioncode":
                            "var links = document.getElementsByTagName('a');" + "for (var i = 0; i < links.length; i++) { "+
                            "  if (links[i].innerHTML.includes('Find John Connor')) {" +
                            "     links[i].click(); " +
                            "  }" +
                            "}"
                        }
                    ]
                }
            },	
            "targets" : 
            [
                {
                    "nickname":"Terminator 1",
                    "ip":"192.168.1.10",
                    "type": "sut"
                },
                {
                    "nickname":"Terminator 2",
                    "ip":"192.168.1.11",
                    "type": "sut",
                    "pass":"nonstandardpass"
                },
                {
                    "nickname":"Terminator 3",
                    "ip":"192.168.1.10",
                    "type": "sut"
                }
            ]	
        }

`version`, `targets` and `targettypes` fields are mandatory.
* version: indicates compatibility with the BargeIn version
* targets: an array of targets that will be displayed as links in the homepage.
  * ip: IP address of the System Under Test (SUT). This can also be a uri without https and any parameters such as `www.domain.com/some/page.php`. BargeIn will prepend https and append a custom index parameter to differentiate targets.
  * nickname: This is also mandatory. It will be shown as part of the link and will also be used to update the title of the application if the user selects the associated target.
  * type: This is mandatory. This type is used to search for the corresponding entry within `targettypes`.
  * other parameters: are not mandatory. When they are not defined as part of the target, the default values are used from corresponding targettype. For example, a SUT has a different password than the standard password, a pass field can be included in this target to specify.
* targettypes: There can be one or more targettypes. This maps `type` field within `targets` to associated properties.
    * uriactions: If you want BargeIn to monitor URIs and take action on a specific page, you can specify the corresponding URI such as the page name and define the javascript to be executed on that page. This can be used to fill out a form, click a button, submit a form, etc.
    * other parms: You can include optional parms here if you would like to use them in uriactions. These parameters can be used as template literals within `actioncode` of `uriactions`.

The sample `config.json` above generates the following homepage:
> <body id="bargeinerrorcode"><h1>Design Test Page</h1><p>Please select a system to login</p><ul><li><a href="#">Terminator 1 (192.168.1.10) </a></li><li><a href="#">Terminator 2 (192.168.1.11) </a></li><li><a href="#">Terminator 3 (192.168.1.10) </a></li></ul></body>

In this example, each system at https://192.168.1.1X redirects to a default page named index.html with a login form as below:

        <form action="/login.php">
            <label for="user">Username:</label>
            <input id="user"><br><br>
            <label for="pwd">Password:</label>
            <input type="password" id="pwd" name="pwd"><br><br>
            <input type="submit" id="login" value="Login">
        </form>

The first of the uriactions array is defined for uri : index.html (the address bar contains https://192.168.1.1X/index.html ) and the action code contains the javascript to find username and password fields and fill them with template literals. The actioncode also finds the login button and clicks it to submit the form and login to the system. This automates logging into the SUT.

In our example, login.php redirects to an admin.html page with links to some administrative tasks. In the second uri action, we look for a hyperlink with text `Find John Connor` and click it.
