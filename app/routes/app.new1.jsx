import { Navigate, useActionData, useLoaderData, useNavigate, useSubmit } from '@remix-run/react';
import {
  LegacyStack,
  Tag,
  Listbox,
  EmptySearchResult,
  Combobox,
  Text,
  AutoSelection,
  Page,
  Card,
  Button,
  TextField,
  Layout,
  Grid,
  Box,
  Checkbox,
  BlockStack,
} from '@shopify/polaris';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuid } from "uuid";
import {
  ChevronLeftIcon
} from '@shopify/polaris-icons';
import shopify from "./app/shopify.server";

export async function loader({ request }) {
  const { admin } = await shopify.authenticate.admin(request);

  const response = await admin.graphql(`
    {
      products(first: 10, query: "inventory_total:>0") {
        nodes {
          createdAt
          description
          id
          title
          totalInventory
          updatedAt
          tracksInventory
          category {
            id
            fullName
          }
        }
      }
    }
  `);

  const shopifyProducts = await response.json();
  return { shopifyProducts: shopifyProducts.data.products.nodes };
}

export async function action({ request }) {
  const { admin } = await shopify.authenticate.admin(request);
  const formData = await request.formData();
  const selectedProductsId = formData.getAll("selectedProductsId");
  const selectedRecommendationsId = formData.getAll("selectedRecommendationsId");
  const title = formData.get("title");
  const isEnabled = formData.get("isEnabled");
  const priority = Number(formData.get("priority"));
  const recommendationId = uuid();
  console.log("Selected Products:", selectedProductsId);
  console.log("Selected Recommendations:", selectedRecommendationsId);
  if (admin) {
    try {
      const response = await fetch('http://localhost:3004/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recommendationId: recommendationId,
          title: title,
          priority: priority,
          triggerProductIds: selectedProductsId,
          recommendedProductIds: selectedRecommendationsId,
          isEnabled: isEnabled
        })
      });
      console.log("-=-", response);
      if (response.status == 200) {
        // const data = await response.json();
        console.log(await response.json());
        return { success: true };
      }
      else {
        return { success: false, error: 'Failed to add recommendation' };
      }
    }
    catch (err) {
      console.log(err);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Not authenticated' };
}

function MultiselectTagComboboxExample() {
  const navigate = useNavigate();
  const { shopifyProducts } = useLoaderData();
  const [priority, setPriority] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Map());
  const [recommendationName, setReccomendationName] = useState('');
  const [selectedRecommendations, setSelectedRecommendations] = useState(new Map());
  const [value, setValue] = useState('');
  const [recommendationValue, setRecommendationValue] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [recommendationSuggestion, setRecommendationSuggestion] = useState('');
  const actionData = useActionData();
  const [error, setError] = useState('');

  const submit = useSubmit();

  useEffect(() => {
    if (actionData && actionData.success) {
      navigate('../new');
    } else if (actionData && actionData.error) {
      setError(actionData.error);
    }
  }, [actionData, navigate])

  const handleTrigger = async () => {
    if (!recommendationName.trim()) {
      setError('Title is required');
      return;
    }
    if (priority <= 0) {
      setError('Priority must be greater than 0');
      return;
    }
    if (selectedProducts.size === 0) {
      setError('At least one product must be selected');
      return;
    }
    if (selectedRecommendations.size === 0) {
      setError('At least one recommendation must be selected');
      return;
    }

    setError('');
    const selectedProductsId = Array.from(selectedProducts.values());
    const selectedRecommendationsId = Array.from(selectedRecommendations.values());

    const formData = new FormData();
    selectedProductsId.forEach(id => formData.append('selectedProductsId', id));
    selectedRecommendationsId.forEach(id => formData.append('selectedRecommendationsId', id));
    formData.append("title", recommendationName);
    formData.append("priority", priority);
    formData.append("isEnabled", isEnabled);

    submit(formData, { replace: true, method: 'POST' });
    // console.log(res);
    // if(res.success)
    //   {
    //   navigate('../new');
    // }
  };


  const handleEnable = async () => {
    setIsEnabled(!isEnabled);
  }

  const handleActiveOptionChange = useCallback(
    (activeOption) => {
      const activeOptionIsAction = activeOption === value;

      if (!activeOptionIsAction && !selectedProducts.has(activeOption)) {
        setSuggestion(activeOption);
      } else {
        setSuggestion('');
      }
    },
    [value, selectedProducts],
  );

  const updateSelection = useCallback(
    (selected) => {
      const product = shopifyProducts.find(p => p.title === selected);
      const nextSelectedProducts = new Map(selectedProducts);

      if (nextSelectedProducts.has(product.title)) {
        nextSelectedProducts.delete(product.title);
      } else {
        nextSelectedProducts.set(product.title, product.id);
      }

      setSelectedProducts(nextSelectedProducts);
      setValue('');
      setSuggestion('');
    },
    [selectedProducts, shopifyProducts],
  );

  const removeTag = useCallback(
    (tag) => () => {
      updateSelection(tag);
    },
    [updateSelection],
  );

  const getAllTags = useCallback(() => {
    const savedTags = shopifyProducts.map(p => p.title);
    return [...new Set([...savedTags, ...selectedProducts.keys()].sort())];
  }, [selectedProducts, shopifyProducts]);

  const handleRecommendationActiveOptionChange = useCallback(
    (activeOption) => {
      const activeOptionIsAction = activeOption === recommendationValue;

      if (!activeOptionIsAction && !selectedRecommendations.has(activeOption)) {
        setRecommendationSuggestion(activeOption);
      } else {
        setRecommendationSuggestion('');
      }
    },
    [recommendationValue, selectedRecommendations],
  );

  const updateRecommendationSelection = useCallback(
    (selected) => {
      const product = shopifyProducts.find(p => p.title === selected);
      const nextSelectedRecommendations = new Map(selectedRecommendations);

      if (nextSelectedRecommendations.has(product.title)) {
        nextSelectedRecommendations.delete(product.title);
      } else {
        nextSelectedRecommendations.set(product.title, product.id);
      }

      setSelectedRecommendations(nextSelectedRecommendations);
      setRecommendationValue('');
      setRecommendationSuggestion('');
    },
    [selectedRecommendations, shopifyProducts],
  );

  const removeRecommendationTag = useCallback(
    (tag) => () => {
      updateRecommendationSelection(tag);
    },
    [updateRecommendationSelection],
  );

  const getAllRecommendationTags = useCallback(() => {
    const savedTags = shopifyProducts.map(p => p.title);
    const selectedProductTitles = new Set(selectedProducts.keys());
    return [...new Set([...savedTags].sort())].filter(tag => !selectedProductTitles.has(tag));
  }, [selectedProducts, shopifyProducts]);

  const formatOptionText = useCallback(
    (option) => {
      const trimValue = value.trim().toLowerCase();
      const matchIndex = option.toLowerCase().indexOf(trimValue);

      if (!value || matchIndex === -1) return option;

      const start = option.slice(0, matchIndex);
      const highlight = option.slice(matchIndex, matchIndex + trimValue.length);
      const end = option.slice(matchIndex + trimValue.length, option.length);

      return (
        <p>
          {start}
          <Text fontWeight="bold" as="span">
            {highlight}
          </Text>
          {end}
        </p>
      );
    },
    [value],
  );

  const escapeSpecialRegExCharacters = useCallback(
    (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    [],
  );

  const options = useMemo(() => {
    let list;
    const allTags = getAllTags();
    const filterRegex = new RegExp(escapeSpecialRegExCharacters(value), 'i');

    if (value) {
      list = allTags.filter((tag) => tag.match(filterRegex));
    } else {
      list = allTags;
    }

    return [...list];
  }, [value, getAllTags, escapeSpecialRegExCharacters]);

  const recommendationOptions = useMemo(() => {
    let list;
    const allTags = getAllRecommendationTags();
    const filterRegex = new RegExp(escapeSpecialRegExCharacters(recommendationValue), 'i');

    if (recommendationValue) {
      list = allTags.filter((tag) => tag.match(filterRegex));
    } else {
      list = allTags;
    }

    return [...list];
  }, [recommendationValue, getAllRecommendationTags, escapeSpecialRegExCharacters]);


  const verticalContentMarkup =
    selectedProducts.size > 0 ? (
      <div>
      <br />
      <Card sectioned>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[...selectedProducts.keys()].map((title) => (
            <div
              key={selectedProducts.get(title)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                border: '1px solid #dfe3e8',
                borderRadius: '3px',
                backgroundColor: '#f4f6f8',
                width: 'calc(100% - 16px)',
                justifyContent: 'space-between',
              }}
            >
              <span>{title}</span>
              <Button
                plain
                onClick={removeTag(title)}
                style={{
                  padding: '0',
                  minHeight: 'unset',
                  color: '#bf0711',
                }}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </Card>
      <br />
      </div>
    ) : null;

    const recommendationVerticalContentMarkup =
    selectedRecommendations.size > 0 ? (
      <div>
        <br />
      {/* <Card sectioned> */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[...selectedRecommendations.keys()].map((title) => (
            <div
              key={selectedRecommendations.get(title)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                border: '1px solid #dfe3e8',
                borderRadius: '3px',
                backgroundColor: '#f4f6f8',
                width: 'calc(100% - 16px)',
                justifyContent: 'space-between',
              }}
            >
              <span>{title}</span>
              <Button
                plain
                onClick={removeRecommendationTag(title)}
                style={{
                  padding: '0',
                  minHeight: 'unset',
                  color: '#bf0711',
                }}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      {/* </Card> */}
      <br />
      </div>
    ) : null;
  

  const optionMarkup =
    options.length > 0
      ? options.map((option) => (
        <Listbox.Option
          key={option}
          value={option}
          selected={selectedProducts.has(option)}
          accessibilityLabel={option}
        >
          <Listbox.TextOption selected={selectedProducts.has(option)}>
            {formatOptionText(option)}
          </Listbox.TextOption>
        </Listbox.Option>
      ))
      : null;

  const recommendationOptionMarkup =
    recommendationOptions.length > 0
      ? recommendationOptions.map((option) => (
        <Listbox.Option
          key={option}
          value={option}
          selected={selectedRecommendations.has(option)}
          accessibilityLabel={option}
        >
          <Listbox.TextOption selected={selectedRecommendations.has(option)}>
            {formatOptionText(option)}
          </Listbox.TextOption>
        </Listbox.Option>
      ))
      : null;

  const noResults = value && !getAllTags().includes(value);

  const actionMarkup = noResults ? (
    <Listbox.Action value={value}>{`Add "${value}"`}</Listbox.Action>
  ) : null;

  const emptyStateMarkup = optionMarkup ? null : (
    <EmptySearchResult
      title=""
      description={`No tags found matching "${value}"`}
    />
  );

  const recommendationNoResults = recommendationValue && !getAllRecommendationTags().includes(recommendationValue);

  const recommendationActionMarkup = recommendationNoResults ? (
    <Listbox.Action value={recommendationValue}>{`Add "${recommendationValue}"`}</Listbox.Action>
  ) : null;

  const recommendationEmptyStateMarkup = recommendationOptionMarkup ? null : (
    <EmptySearchResult
      title=""
      description={`No tags found matching "${recommendationValue}"`}
    />
  );

  const listboxMarkup =
    optionMarkup || actionMarkup || emptyStateMarkup ? (
      <Listbox
        autoSelection={AutoSelection.None}
        onSelect={updateSelection}
        onActiveOptionChange={handleActiveOptionChange}
      >
        {actionMarkup}
        {optionMarkup}
      </Listbox>
    ) : null;

  const recommendationListboxMarkup =
    recommendationOptionMarkup || recommendationActionMarkup || recommendationEmptyStateMarkup ? (
      <Listbox
        autoSelection={AutoSelection.None}
        onSelect={updateRecommendationSelection}
        onActiveOptionChange={handleRecommendationActiveOptionChange}
      >
        {recommendationActionMarkup}
        {recommendationOptionMarkup}
      </Listbox>
    ) : null;

  return (
    <Page backAction={{ content: "Recommendation", url: '/app/new' }} title='Add Recommendation'
      secondaryActions={[
        {
          content: "Save",
          // icon:'save',
          accessibilityLabel: "Secondary action label",
          onAction: () => handleTrigger(),
        }
      ]}
    >
      <Layout>
       
            {/* {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>} */}
            <Layout.Section>
          <Card>
            <TextField label='Title' value={recommendationName} onChange={(e) => setReccomendationName(e)} autoComplete='off' error={error.length>0 && !recommendationName.trim() ? 'Title is required' : null}></TextField>
            <TextField label='Priority' type='number' value={priority} onChange={(e) => setPriority(e)} autoComplete='off' error={error.length>0 &&  priority <= 0 ? 'Priority must be greater than 0' : null}></TextField>
            </Card>
            </Layout.Section>
            {/* <TextField label='Enabled' value={recommendationName} onChange={(e)=>setReccomendationName(e)}  autoComplete='off'></TextField> */}
            <Layout.Section>
            <Card>
            <Combobox
              allowMultiple
              activator={
                <Combobox.TextField
                  autoComplete="off"
                  label="Search products"
                  labelHidden
                  value={value}
                  suggestion={suggestion}
                  placeholder="Search products"
                  // verticalContent={verticalContentMarkup}
                  onChange={setValue}
                  error={error.length>0 && selectedProducts.size === 0 ? 'At least one product must be selected' : null}
                />
              }
            >
              {listboxMarkup}
            </Combobox>
              {verticalContentMarkup}
              </Card>
              </Layout.Section>
              <Layout.Section>
              <Card>
            <Combobox
              allowMultiple
              activator={
                <Combobox.TextField
                  autoComplete="off"
                  label="Search recommendations"
                  labelHidden
                  value={recommendationValue}
                  suggestion={recommendationSuggestion}
                  placeholder="Search recommendations"
                  onChange={setRecommendationValue}
                  error={error.length>0 && selectedRecommendations.size === 0 ? 'At least one recommendation must be selected' : null}
                />
              }
            >
              {recommendationListboxMarkup}
            </Combobox>
            {recommendationVerticalContentMarkup}
            </Card>
            <Checkbox
              label="Enable"
              checked={isEnabled}
              onChange={handleEnable}
            />
          {/* </Card> */}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default MultiselectTagComboboxExample;