"""Adding file reference to vedtak

Revision ID: 49e77b309da3
Revises: 453f3f2f2e5b
Create Date: 2014-11-28 20:16:38.791316

"""

# revision identifiers, used by Alembic.
revision = '49e77b309da3'
down_revision = '453f3f2f2e5b'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('vedtak', sa.Column('vedtaksbrev_file_ref', sa.String(), nullable=True))


def downgrade():
    op.drop_column('vedtak', 'vedtaksbrev_file_ref')

