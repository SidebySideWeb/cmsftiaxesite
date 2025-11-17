/**
 * Upsert helper - Find existing document or create new one
 * Returns the document ID
 */
export async function upsertDocument(payload, collection, where, data) {
  try {
    // Try to find existing document
    const existing = await payload.find({
      collection,
      where,
      limit: 1,
      depth: 0,
    });

    if (existing.docs.length > 0) {
      // Delete existing document first to avoid uniqueness conflicts with array items
      // This is especially important for pages with card grids that have ID conflicts
      const existingId = existing.docs[0].id;
      try {
        await payload.delete({
          collection,
          id: existingId,
        });
        console.log(`   🗑️  Deleted existing ${collection} (ID: ${existingId})`);
      } catch (deleteError) {
        console.log(`   ⚠️  Could not delete existing ${collection}, will try update: ${deleteError.message}`);
        // Fall back to update if delete fails
        try {
          const updated = await payload.update({
            collection,
            id: existingId,
            data,
          });
          console.log(`   ✓ Updated ${collection} (ID: ${updated.id})`);
          return updated.id;
        } catch (updateError) {
          // If update also fails, throw the update error
          throw updateError;
        }
      }
    }
    
    // Create new document (either after delete or if it didn't exist)
    const created = await payload.create({
      collection,
      data,
    });
    console.log(`   ✓ Created ${collection} (ID: ${created.id})`);
    return created.id;
  } catch (error) {
    console.error(`   ✗ Failed to upsert ${collection}:`, error.message);
    
    // Log detailed validation errors if available
    if (error.data?.errors) {
      console.error(`   Validation errors:`);
      error.data.errors.forEach((err, idx) => {
        console.error(`     ${idx + 1}. ${err.path || 'unknown'}: ${err.message || JSON.stringify(err)}`);
      });
    }
    
    if (error.stack) console.error(`   Stack: ${error.stack}`);
    throw error;
  }
}

/**
 * Find document by slug
 */
export async function findDocumentBySlug(payload, collection, slug, tenantId) {
  try {
    const where = {
      slug: {
        equals: slug,
      },
    };

    if (tenantId) {
      where.tenant = {
        equals: tenantId,
      };
    }

    const result = await payload.find({
      collection,
      where,
      limit: 1,
      depth: 0,
    });

    if (result.docs.length > 0) {
      return { id: result.docs[0].id };
    }

    return null;
  } catch (error) {
    console.error(`   ✗ Failed to find ${collection} by slug "${slug}":`, error);
    return null;
  }
}
