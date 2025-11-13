/**
 * Point of Interest Block - Editor
 */
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { PanelBody, TextControl, Button, RangeControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('modular-blocks/point-of-interest', {
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();
        const { backgroundImage, title, description, hotspots } = attributes;

        const addHotspot = () => {
            const newHotspots = [...hotspots, {
                x: 50,
                y: 50,
                title: 'Neuer Hotspot',
                content: 'Inhalt des Hotspots',
                icon: 'info',
                color: '#0073aa',
                size: 'medium',
                animation: 'pulse',
                trigger: 'click'
            }];
            setAttributes({ hotspots: newHotspots });
        };

        const updateHotspot = (index, field, value) => {
            const newHotspots = [...hotspots];
            newHotspots[index][field] = value;
            setAttributes({ hotspots: newHotspots });
        };

        const removeHotspot = (index) => {
            const newHotspots = hotspots.filter((_, i) => i !== index);
            setAttributes({ hotspots: newHotspots });
        };

        return (
            <div {...blockProps}>
                <InspectorControls>
                    <PanelBody title={__('Hintergrundbild', 'modular-blocks-plugin')}>
                        <MediaUploadCheck>
                            <MediaUpload
                                onSelect={(media) => setAttributes({
                                    backgroundImage: {
                                        url: media.url,
                                        alt: media.alt,
                                        id: media.id
                                    }
                                })}
                                allowedTypes={['image']}
                                value={backgroundImage.id}
                                render={({ open }) => (
                                    <Button onClick={open} variant="secondary">
                                        {backgroundImage.url ? __('Bild ändern', 'modular-blocks-plugin') : __('Bild auswählen', 'modular-blocks-plugin')}
                                    </Button>
                                )}
                            />
                        </MediaUploadCheck>
                    </PanelBody>

                    <PanelBody title={__('Hotspots', 'modular-blocks-plugin')}>
                        <Button onClick={addHotspot} variant="primary">
                            {__('Hotspot hinzufügen', 'modular-blocks-plugin')}
                        </Button>
                        {hotspots.map((hotspot, index) => (
                            <div key={index} style={{ marginTop: '15px', padding: '10px', border: '1px solid #ddd' }}>
                                <h4>Hotspot {index + 1}</h4>
                                <TextControl
                                    label={__('Titel', 'modular-blocks-plugin')}
                                    value={hotspot.title}
                                    onChange={(value) => updateHotspot(index, 'title', value)}
                                />
                                <TextControl
                                    label={__('Inhalt', 'modular-blocks-plugin')}
                                    value={hotspot.content}
                                    onChange={(value) => updateHotspot(index, 'content', value)}
                                />
                                <RangeControl
                                    label={__('X Position (%)', 'modular-blocks-plugin')}
                                    value={hotspot.x}
                                    onChange={(value) => updateHotspot(index, 'x', value)}
                                    min={0}
                                    max={100}
                                />
                                <RangeControl
                                    label={__('Y Position (%)', 'modular-blocks-plugin')}
                                    value={hotspot.y}
                                    onChange={(value) => updateHotspot(index, 'y', value)}
                                    min={0}
                                    max={100}
                                />
                                <Button onClick={() => removeHotspot(index)} variant="secondary" isDestructive>
                                    {__('Hotspot entfernen', 'modular-blocks-plugin')}
                                </Button>
                            </div>
                        ))}
                    </PanelBody>
                </InspectorControls>

                <div className="point-of-interest-editor">
                    {backgroundImage.url ? (
                        <div style={{ position: 'relative', maxWidth: '100%' }}>
                            <img src={backgroundImage.url} alt={backgroundImage.alt} style={{ width: '100%', display: 'block' }} />
                            {hotspots.map((hotspot, index) => (
                                <div
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        left: `${hotspot.x}%`,
                                        top: `${hotspot.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '50%',
                                        backgroundColor: hotspot.color,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '12px'
                                    }}
                                >
                                    {index + 1}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f0f0f0', border: '2px dashed #ddd' }}>
                            <p>{__('Wählen Sie ein Hintergrundbild in den Block-Einstellungen', 'modular-blocks-plugin')}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    },

    save: () => null, // Dynamic block
});
