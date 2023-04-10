'use strict';

(function () {
    let activeMarkdownTheme = 'none';
    // Log `title` of current active web page
    const pageTitle = document.head.getElementsByTagName('title')[0].innerHTML;
    console.log(
        `Page title is: '${pageTitle}' - message from 'contentScript.js' file`
    );
    console.log(`DOM ready state: ${document.readyState}`);
    document.onreadystatechange = function () {
        if (document.readyState === 'interactive') {
            console.log('The DOM is interactive, but some resources may still be loading.');
        } else if (document.readyState === 'complete') {
            console.log('The DOM and all resources have finished loading.');
            onDOMLoaded();
        }
    };

    function onDOMLoaded() {
        console.log("DOM LOADED");
        md();
    }

    const port = chrome.runtime.connect({ name: 'changeCSS' });

    port.onMessage.addListener((response) => {
        if (chrome.runtime.lastError) {
            console.error(`Error: ${chrome.runtime.lastError.message}`);
            return;
        }

        if (response.success) {
            console.log(`CSS changed: ${response.selectedOption}`);
            //activeMarkdownTheme = response.selectedOption;
        } else {
            console.error(`Failed to insert CSS: ${response.error}`);
        }
    });

    function createMarkdownDropdownList() {
        const dropdown = document.createElement('select');
        dropdown.id = 'markdown-theme-dropdown';
        dropdown.style.position = 'fixed';
        dropdown.style.top = '10px';
        dropdown.style.right = '10px';
        dropdown.style.zIndex = '10000';

        const options = [
            "none",
            "github-markdown-dark",
            "github-markdown-light",
            "github-markdown",
            "jasonm23-avenir-white",
            "jasonm23-dark",
            "jasonm23-foghorn",
            "jasonm23-swiss",
            "jotander-air",
            "jotander-modest",
            "jotander-retro",
            "thomasf-solarizedcssdark",
            "thomasf-solarizedcsslight",
            "witex"
        ];
        options.forEach((optionText) => {
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = optionText;
            if (optionText === 'none') {
                option.selected = true;
            }
            dropdown.appendChild(option);
        });

        dropdown.addEventListener('change', (event) => {
            const mdBlocks = document.getElementsByTagName('md-block');
            if (mdBlocks.length === 0) onDOMLoaded();
            const selectedOption = event.target.value;
            console.log(`Selected option: ${selectedOption}`);
            const cssFile = `styles/${selectedOption}.css`;
            const previousCssFile = `styles/${activeMarkdownTheme}.css`;
            port.postMessage({ action: 'changeCSS', previousCssFile, cssFile, selectedOption });
            activeMarkdownTheme = selectedOption;
            console.log(`Active markdown theme: ${activeMarkdownTheme}`);
        });

        document.body.appendChild(dropdown);
    }

    function md() {
        console.log('md function called');
        console.log(`DOM ready state: ${document.readyState}`);
        const preElements = document.getElementsByTagName('pre');

        for (let i = preElements.length - 1; i >= 0; i--) {
            const preElement = preElements[i];
            const codeElements = preElement.querySelectorAll('code');

            Array.from(codeElements).forEach((codeElement) => {
                // Create and format the md-block content with valid markdown
                const languageClass = Array.from(codeElement.classList).find((className) => className.startsWith('language-'));
                if (languageClass) {
                    const language = languageClass.substring('language-'.length);
                    console.log(`Programming language: ${language}`);
                    if (language === 'markdown') {
                        // First get rid of all the span html tags in each code block
                        const spanElements = codeElement.querySelectorAll('span');
                        // Iterate through the <span> elements and replace them with their contents
                        if (spanElements && spanElements.length > 0) {
                            const elementsToRemove = [];
                            spanElements.forEach((span) => {
                                const parent = span.parentNode;
                                while (span.firstChild) {
                                    parent.insertBefore(span.firstChild, span);
                                }
                                elementsToRemove.push(span);
                            });

                            elementsToRemove.forEach((span) => {
                                span.parentNode.removeChild(span);
                            });
                        }
                        const mdBlockElement = document.createElement('md-block');
                        mdBlockElement.classList.add(languageClass);
                        mdBlockElement.classList.add('markdown-body');
                        mdBlockElement.textContent = codeElement.textContent;
                        preElement.parentNode.replaceChild(mdBlockElement, preElement);
                        // Convert the markdown to html
                        const markdownText = mdBlockElement.textContent;
                        const htmlContent = marked.parse(markdownText);
                        mdBlockElement.innerHTML = htmlContent;
                    }
                } else {
                    console.log('No language specified for this code block');
                }
            });
        }
    }

    createMarkdownDropdownList();

})();