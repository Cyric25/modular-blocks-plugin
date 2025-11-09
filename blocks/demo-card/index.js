/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
    RichText,
    InspectorControls,
    ColorPalette,
    URLInput,
    BlockControls,
    AlignmentToolbar,
} from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    ColorPicker,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.css';
import './style.css';

/**
 * Block registration
 */
registerBlockType('modular-blocks/demo-card', {
    edit: ({ attributes, setAttributes, className }) => {
        const {
            title,
            content,
            buttonText,
            buttonUrl,
            backgroundColor,
            textColor,
        } = attributes;

        const onChangeTitle = (newTitle) => {
            setAttributes({ title: newTitle });
        };

        const onChangeContent = (newContent) => {
            setAttributes({ content: newContent });
        };

        const onChangeButtonText = (newButtonText) => {
            setAttributes({ buttonText: newButtonText });
        };

        const onChangeButtonUrl = (newButtonUrl) => {
            setAttributes({ buttonUrl: newButtonUrl });
        };

        const onChangeBackgroundColor = (newColor) => {
            setAttributes({ backgroundColor: newColor });
        };

        const onChangeTextColor = (newColor) => {
            setAttributes({ textColor: newColor });
        };

        const blockStyle = {
            '--demo-card-bg-color': backgroundColor,
            '--demo-card-text-color': textColor,
        };

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Karteneinstellungen', 'modular-blocks-plugin')}>
                        <TextControl
                            label={__('Button Text', 'modular-blocks-plugin')}
                            value={buttonText}
                            onChange={onChangeButtonText}
                        />
                        <TextControl
                            label={__('Button URL', 'modular-blocks-plugin')}
                            value={buttonUrl}
                            onChange={onChangeButtonUrl}
                        />
                    </PanelBody>
                    <PanelBody title={__('Farben', 'modular-blocks-plugin')}>
                        <h4>{__('Hintergrundfarbe', 'modular-blocks-plugin')}</h4>
                        <ColorPicker
                            color={backgroundColor}
                            onChangeComplete={onChangeBackgroundColor}
                        />
                        <h4>{__('Textfarbe', 'modular-blocks-plugin')}</h4>
                        <ColorPicker
                            color={textColor}
                            onChangeComplete={onChangeTextColor}
                        />
                    </PanelBody>
                </InspectorControls>

                <div className={`${className} wp-block-modular-blocks-demo-card`} style={blockStyle}>
                    <div className="demo-card-container">
                        <RichText
                            tagName="h3"
                            className="demo-card-title"
                            value={title}
                            onChange={onChangeTitle}
                            placeholder={__('Titel eingeben...', 'modular-blocks-plugin')}
                        />

                        <RichText
                            tagName="div"
                            className="demo-card-content"
                            value={content}
                            onChange={onChangeContent}
                            placeholder={__('Inhalt eingeben...', 'modular-blocks-plugin')}
                            multiline="p"
                        />

                        {(buttonText || buttonUrl) && (
                            <div className="demo-card-actions">
                                <div className="demo-card-button">
                                    {buttonText || __('Button Text', 'modular-blocks-plugin')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Fragment>
        );
    },

    save: () => {
        // Dynamic block - rendered by PHP
        return null;
    },
});