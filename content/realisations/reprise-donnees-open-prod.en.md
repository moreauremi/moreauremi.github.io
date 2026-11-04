---
# Traduction anglaise de reprise-donnees-open-prod.md. Seuls les champs
# traduits sont ici (titre, resume, statut) : les autres viennent du fichier
# français.
titre: "Data migration into Open-Prod"
statut: "completed"
resume: "Data migration on my Open-Prod test database, after the data model and data migration training at 1Life: item categories, items (without obsolete ones), routings, bills of materials, customers, prospects and suppliers, about 1,100 rows prepared in Excel with VLOOKUP and XLOOKUP, then imported with Open-Prod's import tool."
---

## Context

When a company moves to Open-Prod, its existing data (customers, suppliers, items, stock…) is often in Excel files or in its old software. Transferring it into the new ERP is called **data migration**: it is a mandatory step in any integration project, and a mistake at this point then shows up in every order and invoice.

After a training course on the subject at 1Life, I carried out a complete migration again on my Open-Prod test database.

I migrated the master data of a manufacturing company: item categories, items, routings, bills of materials, customers, prospects and suppliers, about **1,100 rows** in total.

The source files are those of a **training database** provided for the course: fictitious data that mirrors a real customer's.

## Objectives

- Understand where each piece of information goes in Open-Prod, from its **conceptual data model** (in French, MCD).
- Prepare Excel files in the format expected by Open-Prod's import.
- Match the files with one another so that the imported data is linked correctly.
- Import the data, then check the result in the ERP.

## Implementation

### Reading the data model

The **conceptual data model** represents the information in a system and the links between them: for example, an item belongs to a category, an order is linked to a customer. Reading it tells you which data to import, and in which order: an item that refers to a category can only be imported once the category exists.

The import order follows the links between the data:

1. **Item categories**: each item is filed in a category, so the category must exist before the item.
2. **Items**: sorted beforehand so as **not to migrate obsolete items**, which are no longer used and would clutter the new database.
3. **Routings**: the list of manufacturing operations for an item (steps, work centres, times). They refer to the items.
4. **Bills of materials**: the list of components needed to make an item. They link items to one another, so all of them must already be imported.
5. **Customers, prospects and suppliers**.

To sort the items, I relied on their **status** in the source file: *in development*, *active* or *obsolete*. I chose to migrate every item except the obsolete ones: the ones in development will soon be manufactured, so they need to exist in the new ERP.

### Preparing and matching the files

The source data is spread across several Excel files. To link them, I used **VLOOKUP** and **XLOOKUP**: these functions look up a value (a customer code, an item reference…) in another file and bring back the matching information.

In the source file, the information for a single item was **spread over several sheets**: its suppliers on one sheet, its links to routings and bills of materials on another. But the import tool expects one complete row per item.

So I created a **final sheet** in the file. For each item, a VLOOKUP or XLOOKUP formula looks up its reference in each of the other sheets and brings back the matching information: the supplier from the suppliers sheet, the routing and bill of materials from the links sheet. The final sheet thus gathers everything to import, without copying a single value by hand.

### Importing into Open-Prod

The import is done with **Open-Prod's import tool**: you give it the Excel file, then match each column in the file to the corresponding field in the ERP (for example, the "Reference" column to the item's reference field). This step is called **column mapping**: if a column is mapped to the wrong field, the data is imported in the wrong place.

Before importing, I corrected in the files the values that did not match those expected by Open-Prod (see the difficulties encountered). The import then reported **no errors**.

## Screenshots

![Placeholder for a screenshot of an Excel file prepared for import](captures/a-venir.svg "An Excel file prepared for import, with its lookup formulas (screenshot to come)")

![Placeholder for a screenshot of the data imported into Open-Prod](captures/a-venir.svg "The data imported into Open-Prod, on the test database (screenshot to come)")

## Results and testing

About **1,100 rows** imported in total.

An import without errors does not prove the data is **usable**: an item can be created with an incomplete bill of materials or routing. To check further, we picked an imported item at random and **started its production** in Open-Prod. The manufacturing order was created with its components (bill of materials) and its operations (routing): the migrated data works together, not just each part on its own.

## Difficulties encountered

**Values in French, expected in English.** In the resource categories (the means used by the routings), the source file said "Humaine" and "Machine", whereas Open-Prod expects the English technical values `human` and `machine`. Imported as they were, these rows would have been rejected or misclassified. I replaced all the values in the file with **Find and Replace** (Ctrl + H) in Excel, before importing.

This problem shows that a customer file that a human can read is not necessarily in the format the ERP expects: you have to compare the file's values with those each field accepts before importing.

## Skills applied

- Reading a conceptual data model
- Consolidating data spread over several Excel sheets into one import sheet (VLOOKUP, XLOOKUP)
- Sorting the data to migrate by status (obsolete items left out)
- Formatting data the way the ERP expects (technical field values)
- Importing data into an ERP with column mapping, in the order imposed by the links between the data
- Functional check of the result: starting production on an imported item
