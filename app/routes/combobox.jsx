import {
    LegacyStack,
    Tag,
    Listbox,
    Combobox,
    Icon,
    TextContainer,
  } from '@shopify/polaris';
  import { SearchIcon } from '@shopify/polaris-icons';
  import { useState, useCallback, useMemo } from 'react';
  
  function MultiAutoCombobox({ options, selectedOptions, setSelectedOptions, label }) {
    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
  
    const updateText = useCallback(
      (value) => {
        setInputValue(value);
        if (value === '') {
          setFilteredOptions(options);
          return;
        }
        const filterRegex = new RegExp(value, 'i');
        const resultOptions = options.filter((option) => option.label.match(filterRegex));
        setFilteredOptions(resultOptions);
      },
      [options],
    );
  
    const updateSelection = useCallback(
      (selected) => {
        if (selectedOptions.includes(selected)) {
          setSelectedOptions(selectedOptions.filter((option) => option !== selected));
        } else {
          setSelectedOptions([...selectedOptions, selected]);
        }
        updateText('');
      },
      [selectedOptions, updateText],
    );
  
    const removeTag = useCallback(
      (tag) => () => {
        setSelectedOptions(selectedOptions.filter((option) => option !== tag));
      },
      [selectedOptions],
    );
  
    const tagsMarkup = selectedOptions.map((option) => (
      <Tag key={`option-${option}`} onRemove={removeTag(option)}>
        {options.find(opt => opt.value === option)?.label}
      </Tag>
    ));
  
    const optionsMarkup =
      filteredOptions.length > 0
        ? filteredOptions.map((option) => {
            return (
              <Listbox.Option
                key={`${option.value}`}
                value={option.value}
                selected={selectedOptions.includes(option.value)}
                accessibilityLabel={option.label}
              >
                {option.label}
              </Listbox.Option>
            );
          })
        : null;
  
    return (
      <div style={{ }}>
        <Combobox
          allowMultiple
          activator={
            <Combobox.TextField
              prefix={<Icon source={SearchIcon} />}
              onChange={updateText}
              label={label}
              labelHidden
              value={inputValue}
              placeholder="Search products"
              autoComplete="off"
            />
          }
        >
          {optionsMarkup ? <Listbox onSelect={updateSelection}>{optionsMarkup}</Listbox> : null}
        </Combobox>
        <TextContainer>
          <LegacyStack>{tagsMarkup}</LegacyStack>
        </TextContainer>
      </div>
    );
  }
  
  export default MultiAutoCombobox;
  