jQuery LiveEdit Plugin - An alternative visual editor
=====================================================

jquery.liveedit is intended to be a simpler alternative to WYSIWYG editors. LiveEdit converts textareas into editable markup suitable for inline editing.

What is jquery.liveedit good for?
---------------------------------

- inline editing: editable content appears just as it would in its published state
- controlled layouts: markup is constrained to simple, pre-defined elements
- simplified markup: with normal use, it's difficult to produce wonky html


What is jquery.liveedit not ideal for?
--------------------------------------
- completely free-from html: liveedit attempts to limit user interaction to the construction of headings and paragraphs
- multi-level nesting: in keeping with simplified markup, liveedit attempts to keep things tidy at a single level of nested content

How do I use it?
----------------

Say you have the following HTML:

    <div id="edittools"></div>
    <textarea id="editor"></textarea>

Apply the liveedit to your textarea. The textarea will be replaced with the live editor.

    $('#editor').liveedit();
    
And add the ability to drag paragraphs, h1, h2, and images to the editor.

    $('#editor').liveedit('addtools', { 'target':'#edittools', 'enable': ['h1','h2','p','img'] });

As updates are made to the live edit document, these changes will be reflected in the markup inside your hidden textarea and any form posts should work as usual.
