const fs = require('fs');

const path = 'd:\\mc\\mobile_app\\app\\(drawer)\\place-submission.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace imports
content = content.replace(
    "import SubmitTravelForm from '@/components/essentials/SubmitTravalForm';",
    "import EssentialSubmitForm from '@/components/essentials/EssentialSubmitForm';"
);

// 2. Remove states and functions now in EssentialSubmitForm
const removeRegexes = [
    // form state
    /const \[form, setForm\] = useState\(\{[\s\S]*?\}\);/m,
    // fromTime, toTime, pickers
    /const \[fromTime, setFromTime\] = useState[^;]*;/m,
    /const \[toTime, setToTime\] = useState[^;]*;/m,
    /const \[showFromPicker, setShowFromPicker\] = useState[^;]*;/m,
    /const \[showToPicker, setShowToPicker\] = useState[^;]*;/m,
    /const \[errors, setErrors\] = useState[^;]*;/m,
    /const \[routePickerIndex, setRoutePickerIndex\] = useState[^;]*;/m,
    /const \[isOptimizingDesc, setIsOptimizingDesc\] = useState[^;]*;/m,
    /const \[isOptimizingServices, setIsOptimizingServices\] = useState[^;]*;/m,
    /const \[descriptionHeight, setDescriptionHeight\] = useState[^;]*;/m,
    /const \[servicesSelection, setServicesSelection\] = useState[^;]*;/m,
    
    // optimizeText
    /const handleOptimizeText = async \([\s\S]*?};/m,

    // hasChanges
    /const hasChanges = React.useMemo\(\(\) => \{[\s\S]*?\}\), \[form, uploadedImage, editData, isEditing\]\);/m,

    // handleChange etc
    /const handleChange = \([\s\S]*?};/m,
    /const insertServicesFormatting = \([\s\S]*?};/m,
    /const handleMetadataChange = \([\s\S]*?};/m,
    /const handleContactChange = \([\s\S]*?};/m,
    /const addContact = \([\s\S]*?};/m,
    /const removeContact = \([\s\S]*?};/m,
    /const addRoute = \([\s\S]*?};/m,
    /const removeRoute = \([\s\S]*?};/m,
    /const handleRouteChange = \([\s\S]*?};/m,

    // handleSubmit
    /const { submitMutation } = useEssentialsAPI\(\);/m,
    /const isPending = submitMutation\.isPending;/m,
    /const handleSubmit = \(\) => \{[\s\S]*?\}\);[\s]*\n[\s]*\};/m
];

removeRegexes.forEach(regex => {
    content = content.replace(regex, '');
});

// 3. Replace the UI block
// From `{isTravel ? (` to `</ScrollView>`
const startPattern = '{isTravel ? (';
const endPattern = '</ScrollView>';
const startIndex = content.indexOf(startPattern);
const endIndex = content.indexOf(endPattern, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `<EssentialSubmitForm
                            category={category || 'general'}
                            editData={editData}
                            typesToRender={typesToRender}
                            availableTags={availableTags}
                            uploadedImage={uploadedImage}
                            isUploading={isUploading}
                            onSuccess={() => {
                                if (!isEditing) setShowThankYou(true);
                                else handleGoBack();
                            }}
                            onCancel={handleGoBack}
                        />
                    </ScrollView>`;
    content = content.substring(0, startIndex) + replacement + content.substring(endIndex + endPattern.length);
}

fs.writeFileSync(path, content);
console.log('Refactoring complete');
