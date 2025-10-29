<template>
  <div class="edit-review">
    <h1>Uredi recenziju</h1>
    <ReviewForm 
      :itemId="review.itemId"
      :itemName="review.itemName"
      :editMode="true"
      :existingReview="review"
    />
  </div>
</template>